'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { FiCamera, FiSend, FiX } from 'react-icons/fi';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { captureElementScreenshot } from '@/lib/capture-screen';
import {
  formatBrowserErrorsForReport,
  getRecentBrowserErrors,
  installSupportConsoleBuffer,
} from '@/lib/support-console-buffer';
import { resolveTopicSuggestions } from '@/lib/support-topic-suggestions';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

/** Slash command tokens are always English, regardless of UI locale. */
const HELP_COMMAND = '/help';
const BUG_REPORT_COMMAND = '/bug-report';
const HELP_RE = /^\/help(?:\s+.*)?$/i;
const BUG_REPORT_RE = /^\/bug-report(?:\s+([\s\S]*))?$/i;
const CANONICAL_SLASH_COMMANDS = [
  { command: HELP_COMMAND },
  { command: BUG_REPORT_COMMAND },
] as const;
const MIN_BUG_STEPS = 20;
const SEND_COOLDOWN_MS = 10_000;
const HISTORY_STORAGE_PREFIX = 'support-chat-history-v1';

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatBugReportPayload(description: string, browserErrors: string[]): string {
  return `[BUG REPORT]\n${description.trim()}\n\n${formatBrowserErrorsForReport(browserErrors)}`;
}

function isNetworkFailure(err: unknown): boolean {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true;
  if (err instanceof TypeError) return true;
  if (err instanceof DOMException && (err.name === 'AbortError' || err.name === 'TimeoutError')) {
    return true;
  }
  if (err instanceof Error) {
    const message = err.message.toLowerCase();
    return (
      message.includes('failed to fetch') ||
      message.includes('networkerror') ||
      message.includes('network request failed') ||
      message.includes('load failed') ||
      message.includes('fetch failed') ||
      message.includes('aborted')
    );
  }
  return false;
}

type SupportChatPanelProps = {
  onClose?: () => void;
  className?: string;
};

type SendOptions = {
  retry?: boolean;
  apiContent?: string;
  screenshot?: string | null;
  browserErrors?: string[];
};

export function SupportChatPanel({ onClose, className = '' }: SupportChatPanelProps) {
  const strings = useRegistryStrings('components/support/SupportChat');
  const { locale } = useLocale();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'assistant', content: strings.welcomeMessage },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(
    () => typeof navigator !== 'undefined' && !navigator.onLine,
  );
  const [slashHighlight, setSlashHighlight] = useState(0);
  const [topicSeed, setTopicSeed] = useState(strings.welcomeMessage);
  const [bugMode, setBugMode] = useState(false);
  const [bugSteps, setBugSteps] = useState('');
  const [bugScreenshot, setBugScreenshot] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef(messages);
  const loadingRef = useRef(loading);
  const pendingRetryRef = useRef<string | null>(null);
  const pendingApiContentRef = useRef<string | null>(null);
  const pendingScreenshotRef = useRef<string | null>(null);
  const pendingBrowserErrorsRef = useRef<string[]>([]);
  const lastSentAtRef = useRef(0);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sendMessageRef = useRef<(text: string, options?: SendOptions) => Promise<void>>(
    async () => undefined,
  );

  messagesRef.current = messages;
  loadingRef.current = loading;

  const suggestionChips = useMemo(
    () =>
      bugMode
        ? []
        : resolveTopicSuggestions(
            strings.topicSuggestions,
            strings.suggestions,
            topicSeed,
            messages[messages.length - 1]?.content ?? '',
          ),
    [bugMode, strings.topicSuggestions, strings.suggestions, topicSeed, messages],
  );
  const historyStorageKey = `${HISTORY_STORAGE_PREFIX}:${locale}`;
  const cooldownRemainingMs = Math.max(0, cooldownUntil - nowMs);
  const cooldownRemainingSec = Math.ceil(cooldownRemainingMs / 1000);

  const slashQuery = useMemo(() => {
    if (!input.startsWith('/')) return null;
    if (input.includes(' ')) return null;
    return input.slice(1).toLowerCase();
  }, [input]);

  const slashCatalog = useMemo(
    () =>
      CANONICAL_SLASH_COMMANDS.map((canonical) => {
        const localized = strings.slashCommands.find(
          (item) => item.command.toLowerCase() === canonical.command,
        );
        return {
          command: canonical.command,
          description: localized?.description ?? canonical.command,
        };
      }),
    [strings.slashCommands],
  );

  const slashSuggestions = useMemo(() => {
    if (slashQuery === null) return [];
    return slashCatalog.filter((item) => {
      const command = item.command.toLowerCase();
      return command === `/${slashQuery}` || command.startsWith(`/${slashQuery}`);
    });
  }, [slashQuery, slashCatalog]);

  useEffect(() => {
    installSupportConsoleBuffer();
  }, []);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(historyStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        messages?: ChatMessage[];
        topicSeed?: string;
      };
      if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
        const clean = parsed.messages
          .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
          .slice(-24);
        if (clean.length > 0) {
          setMessages(clean);
          messagesRef.current = clean;
        }
      }
      if (typeof parsed.topicSeed === 'string' && parsed.topicSeed.trim()) {
        setTopicSeed(parsed.topicSeed);
      }
    } catch {
      // ignore storage parse errors
    }
  }, [historyStorageKey]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(
        historyStorageKey,
        JSON.stringify({
          messages: messages.slice(-24),
          topicSeed,
        }),
      );
    } catch {
      // ignore storage write errors
    }
  }, [messages, topicSeed, historyStorageKey]);

  useEffect(() => {
    if (cooldownRemainingMs <= 0) return;
    const timer = window.setInterval(() => setNowMs(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [cooldownRemainingMs]);

  useEffect(() => {
    setSlashHighlight(0);
  }, [slashQuery, slashSuggestions.length]);

  const clearRetryTimer = () => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  };

  const scheduleRetry = (text: string) => {
    if (retryCountRef.current >= 3) return;
    clearRetryTimer();
    retryCountRef.current += 1;
    retryTimerRef.current = setTimeout(() => {
      if (pendingRetryRef.current === text && !loadingRef.current) {
        void sendMessageRef.current(text, { retry: true });
      }
    }, 1500 * retryCountRef.current);
  };

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading, reconnecting, bugMode]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const applySlashCommand = (command: string) => {
    setInput(command === HELP_COMMAND ? command : `${command} `);
    setSlashHighlight(0);
    inputRef.current?.focus();
  };

  const buildHelpMessage = () =>
    [strings.helpIntro, ...slashCatalog.map((item) => `• ${item.command} — ${item.description}`)].join(
      '\n',
    );

  const startBugMode = (seedText?: string) => {
    setBugMode(true);
    setBugSteps(seedText?.trim() || '');
    setBugScreenshot(null);
    setDynamicTopicFromText(seedText || BUG_REPORT_COMMAND);
    setInput('');
  };

  const setDynamicTopicFromText = (text: string) => {
    setTopicSeed(text);
  };

  const captureBugScreenshot = async () => {
    setCapturing(true);
    setError(null);
    try {
      const dataUrl = await captureElementScreenshot(document.documentElement, {
        maxWidth: 1280,
        quality: 0.8,
      });
      setBugScreenshot(dataUrl);
    } catch {
      setError(strings.bugReportScreenshotFailed);
    } finally {
      setCapturing(false);
    }
  };

  const submitBugReport = async () => {
    const steps = bugSteps.trim();
    if (steps.length < MIN_BUG_STEPS) {
      setError(strings.bugReportStepsRequired);
      return;
    }
    if (!bugScreenshot) {
      setError(strings.bugReportScreenshotRequired);
      return;
    }

    const browserErrors = getRecentBrowserErrors();
    const apiContent = formatBugReportPayload(steps, browserErrors);
    const displayText = `${BUG_REPORT_COMMAND} ${steps}`;

    setBugMode(false);
    setBugSteps('');
    pendingScreenshotRef.current = bugScreenshot;
    pendingBrowserErrorsRef.current = browserErrors;
    setBugScreenshot(null);

    await sendMessage(displayText, {
      apiContent,
      screenshot: pendingScreenshotRef.current,
      browserErrors,
    });
  };

  const sendMessage = async (text: string, options?: SendOptions) => {
    const trimmed = text.trim();
    if (!trimmed || loadingRef.current) return;

    setError(null);

    const isCommand = HELP_RE.test(trimmed) || BUG_REPORT_RE.test(trimmed);
    if (!options?.retry && !isCommand) {
      const now = Date.now();
      const remaining = cooldownUntil - now;
      if (remaining > 0) {
        const secs = Math.ceil(remaining / 1000);
        setError(`${strings.errorRateLimit} (${secs}s)`);
        return;
      }
    }

    let apiContent = options?.retry
      ? pendingApiContentRef.current || trimmed
      : options?.apiContent || trimmed;
    let nextMessages = messagesRef.current;
    let screenshot = options?.retry
      ? pendingScreenshotRef.current
      : options?.screenshot ?? null;
    let browserErrors = options?.retry
      ? pendingBrowserErrorsRef.current
      : options?.browserErrors ?? [];

    if (!options?.retry) {
      if (HELP_RE.test(trimmed)) {
        setInput('');
        const userMessage: ChatMessage = { id: createId(), role: 'user', content: HELP_COMMAND };
        const helpMessage: ChatMessage = {
          id: createId(),
          role: 'assistant',
          content: buildHelpMessage(),
        };
        nextMessages = [...messagesRef.current, userMessage, helpMessage];
        setMessages(nextMessages);
        messagesRef.current = nextMessages;
        setBugMode(false);
        setDynamicTopicFromText(HELP_COMMAND);
        return;
      }

      const bugMatch = trimmed.match(BUG_REPORT_RE);
      if (bugMatch && !options?.apiContent) {
        setInput('');
        const userMessage: ChatMessage = {
          id: createId(),
          role: 'user',
          content: bugMatch[1]?.trim()
            ? `${BUG_REPORT_COMMAND} ${bugMatch[1].trim()}`
            : BUG_REPORT_COMMAND,
        };
        const promptMessage: ChatMessage = {
          id: createId(),
          role: 'assistant',
          content: strings.bugReportPrompt,
        };
        nextMessages = [...messagesRef.current, userMessage, promptMessage];
        setMessages(nextMessages);
        messagesRef.current = nextMessages;
        startBugMode(bugMatch[1]?.trim());
        return;
      }

      setInput('');
      const userMessage: ChatMessage = { id: createId(), role: 'user', content: trimmed };
      nextMessages = [...messagesRef.current, userMessage];
      setMessages(nextMessages);
      messagesRef.current = nextMessages;
      pendingApiContentRef.current = apiContent;
      pendingScreenshotRef.current = screenshot;
      pendingBrowserErrorsRef.current = browserErrors;
      setDynamicTopicFromText(trimmed);

      if (!isCommand) {
        const now = Date.now();
        lastSentAtRef.current = now;
        setCooldownUntil(now + SEND_COOLDOWN_MS);
        setNowMs(now);
      }
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      pendingRetryRef.current = trimmed;
      setReconnecting(true);
      return;
    }

    setLoading(true);
    loadingRef.current = true;

    try {
      const history = nextMessages
        .filter((message) => message.id !== 'welcome')
        .slice(-12)
        .map(({ role, content }, index, list) => {
          const isLastUser = role === 'user' && index === list.length - 1;
          return {
            role,
            content: isLastUser ? apiContent : content,
          };
        });

      const res = await fetch('/api/public/support-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          locale,
          screenshot: screenshot || undefined,
          browserErrors,
        }),
      });

      let data: {
        reply?: string;
        error?: string;
        code?: string;
      } = {};
      try {
        data = (await res.json()) as typeof data;
      } catch {
        throw new Error(strings.errorGeneric);
      }

      if (!res.ok) {
        const code = data.code;
        if (code === 'RATE_LIMIT' || (res.status === 429 && code !== 'QUOTA')) {
          throw new Error(strings.errorRateLimit);
        }
        if (code === 'QUOTA') {
          throw new Error(strings.errorQuota || strings.errorRateLimit);
        }
        if (code === 'NOT_CONFIGURED' || code === 'AUTH') {
          throw new Error(strings.errorNotConfigured);
        }
        if (code === 'MODEL' || code === 'UNAVAILABLE') {
          throw new Error(strings.errorUnavailable || strings.errorGeneric);
        }
        if (res.status === 503) {
          throw new Error(strings.errorNotConfigured);
        }
        throw new Error(data.error || strings.errorGeneric);
      }
      if (!data.reply) {
        throw new Error(strings.errorGeneric);
      }

      pendingRetryRef.current = null;
      pendingApiContentRef.current = null;
      pendingScreenshotRef.current = null;
      pendingBrowserErrorsRef.current = [];
      retryCountRef.current = 0;
      clearRetryTimer();
      setReconnecting(false);
      setMessages((current) => [...current, { id: createId(), role: 'assistant', content: data.reply! }]);
      setDynamicTopicFromText(`${trimmed}\n${data.reply}`);
    } catch (err) {
      if (isNetworkFailure(err)) {
        pendingRetryRef.current = trimmed;
        setReconnecting(true);
        if (typeof navigator === 'undefined' || navigator.onLine) {
          scheduleRetry(trimmed);
        }
      } else {
        pendingRetryRef.current = null;
        pendingApiContentRef.current = null;
        retryCountRef.current = 0;
        clearRetryTimer();
        const message = err instanceof Error ? err.message : strings.errorGeneric;
        setError(message);
      }
    } finally {
      setLoading(false);
      loadingRef.current = false;
      inputRef.current?.focus();
    }
  };

  sendMessageRef.current = sendMessage;

  useEffect(() => {
    const onOffline = () => {
      setReconnecting(true);
    };

    const onOnline = () => {
      const pending = pendingRetryRef.current;
      if (pending) {
        retryCountRef.current = 0;
        setReconnecting(true);
        void sendMessageRef.current(pending, { retry: true });
        return;
      }
      setReconnecting(false);
    };

    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setReconnecting(true);
    }

    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (bugMode) {
      void submitBugReport();
      return;
    }
    if (slashSuggestions.length > 0) {
      const selected = slashSuggestions[slashHighlight] ?? slashSuggestions[0];
      if (selected) {
        applySlashCommand(selected.command);
        return;
      }
    }
    void sendMessage(input);
  };

  return (
    <div
      className={`screen-report-ignore flex h-dvh max-h-dvh w-full flex-col overflow-hidden rounded-none border-0 bg-white shadow-none sm:h-[min(72dvh,560px)] sm:max-h-none sm:rounded-2xl sm:border sm:border-slate-200/90 sm:shadow-[0_20px_60px_-20px_rgba(14,21,72,0.35)] ${className}`}
    >
      <div className="flex items-center gap-3 border-b border-slate-100 bg-[#0E1548] px-4 py-3.5 pt-[max(0.875rem,env(safe-area-inset-top))] text-white">
        <span className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full">
          <Image src="/ai-destek.png" alt="" width={40} height={40} className="h-full w-full object-cover" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-tight">{strings.title}</p>
          <p className="text-[11px] text-white/70">{strings.subtitle}</p>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
            aria-label={strings.close}
          >
            <FiX className="h-5 w-5" aria-hidden />
          </button>
        ) : null}
      </div>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50/80 px-3.5 py-3.5">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                message.role === 'user'
                  ? 'bg-[#0E1548] text-white'
                  : 'border border-slate-200/80 bg-white text-slate-800 shadow-sm'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}

        {loading ? (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-slate-200/80 bg-white px-3.5 py-2.5 text-sm text-slate-500 shadow-sm">
              {strings.thinking}
            </div>
          </div>
        ) : null}

        {reconnecting ? (
          <div className="flex justify-center px-2" role="status" aria-live="polite">
            <p className="rounded-full border border-amber-200/80 bg-amber-50 px-3 py-1.5 text-center text-[11px] font-medium text-amber-800 shadow-sm">
              {strings.connectionLostReconnecting}
            </p>
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="border-t border-slate-100 bg-white px-3.5 py-2">
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
        </div>
      ) : null}

      <div className="relative border-t border-slate-100 bg-white px-3.5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {bugMode ? (
          <div className="mb-3 space-y-2.5 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
            <p className="text-[11px] font-medium text-slate-600">{strings.bugReportFormTitle}</p>
            <textarea
              value={bugSteps}
              onChange={(event) => setBugSteps(event.target.value)}
              rows={3}
              placeholder={strings.bugReportStepsPlaceholder}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#0E1548]/30 focus:ring-2 focus:ring-[#0E1548]/10"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void captureBugScreenshot()}
                disabled={capturing || loading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <FiCamera className="h-3.5 w-3.5" aria-hidden />
                {capturing ? strings.bugReportCapturing : strings.bugReportCapture}
              </button>
              {bugScreenshot ? (
                <span className="text-[11px] font-medium text-emerald-700">
                  {strings.bugReportScreenshotReady}
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">{strings.bugReportScreenshotRequired}</span>
              )}
            </div>
            {bugScreenshot ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={bugScreenshot}
                alt=""
                className="max-h-28 w-full rounded-lg border border-slate-200 object-cover object-top"
              />
            ) : null}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setBugMode(false);
                  setBugSteps('');
                  setBugScreenshot(null);
                }}
                className="rounded-lg px-3 py-2 text-[11px] font-medium text-slate-500 hover:bg-slate-100"
              >
                {strings.bugReportCancel}
              </button>
              <button
                type="button"
                onClick={() => void submitBugReport()}
                disabled={loading || capturing}
                className="ml-auto rounded-lg bg-[#0E1548] px-3 py-2 text-[11px] font-semibold text-white disabled:opacity-50"
              >
                {strings.bugReportSubmit}
              </button>
            </div>
          </div>
        ) : null}

        {!bugMode && suggestionChips.length > 0 ? (
          <div className="mb-2.5 flex flex-wrap gap-1.5">
            {suggestionChips.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => void sendMessage(suggestion)}
                disabled={loading}
                className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-slate-600 transition hover:border-[#0E1548]/20 hover:bg-[#0E1548]/[0.04] hover:text-[#0E1548] disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}

        {!bugMode && slashSuggestions.length > 0 ? (
          <div
            className="absolute bottom-[calc(100%-0.25rem)] left-3.5 right-3.5 z-10 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_12px_32px_-16px_rgba(14,21,72,0.35)]"
            role="listbox"
            aria-label={strings.slashCommandsLabel}
          >
            {slashSuggestions.map((item, index) => (
              <button
                key={item.command}
                type="button"
                role="option"
                aria-selected={index === slashHighlight}
                onMouseDown={(event) => {
                  event.preventDefault();
                  applySlashCommand(item.command);
                }}
                onMouseEnter={() => setSlashHighlight(index)}
                className={`flex w-full items-start gap-2 px-3 py-2.5 text-left transition ${
                  index === slashHighlight ? 'bg-[#0E1548]/[0.06]' : 'bg-white hover:bg-slate-50'
                }`}
              >
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-[#0E1548]">
                  {item.command}
                </span>
                <span className="text-[11px] leading-snug text-slate-600">{item.description}</span>
              </button>
            ))}
          </div>
        ) : null}

        {!bugMode ? (
          <>
            <p className="mb-2 text-[10px] leading-snug text-slate-400">
              {strings.inputHint}
              {cooldownRemainingSec > 0 ? ` · Slow down: ${cooldownRemainingSec}s` : ''}
            </p>
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (slashSuggestions.length > 0) {
                    if (event.key === 'ArrowDown') {
                      event.preventDefault();
                      setSlashHighlight((current) => (current + 1) % slashSuggestions.length);
                      return;
                    }
                    if (event.key === 'ArrowUp') {
                      event.preventDefault();
                      setSlashHighlight(
                        (current) =>
                          (current - 1 + slashSuggestions.length) % slashSuggestions.length,
                      );
                      return;
                    }
                    if (event.key === 'Tab') {
                      event.preventDefault();
                      const selected = slashSuggestions[slashHighlight] ?? slashSuggestions[0];
                      if (selected) applySlashCommand(selected.command);
                      return;
                    }
                    if (event.key === 'Escape') {
                      event.preventDefault();
                      setInput('');
                      return;
                    }
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      const selected = slashSuggestions[slashHighlight] ?? slashSuggestions[0];
                      if (selected) applySlashCommand(selected.command);
                      return;
                    }
                  }

                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void sendMessage(input);
                  }
                }}
                rows={2}
                placeholder={strings.placeholder}
                disabled={loading}
                className="min-h-[42px] flex-1 resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#0E1548]/30 focus:ring-2 focus:ring-[#0E1548]/10 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={
                  loading ||
                  cooldownRemainingSec > 0 ||
                  (!input.trim() && slashSuggestions.length === 0)
                }
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0E1548] text-white transition hover:bg-[#141d5c] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={strings.send}
              >
                <FiSend className="h-4 w-4" aria-hidden />
              </button>
            </form>
          </>
        ) : null}
      </div>
    </div>
  );
}
