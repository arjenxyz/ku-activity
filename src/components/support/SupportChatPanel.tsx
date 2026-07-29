'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { FiSend, FiX } from 'react-icons/fi';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

type SupportChatPanelProps = {
  onClose?: () => void;
  className?: string;
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
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setError(null);
    setInput('');

    const userMessage: ChatMessage = { id: createId(), role: 'user', content: trimmed };
    setMessages((current) => [...current, userMessage]);
    setLoading(true);

    try {
      const history = [...messages, userMessage]
        .filter((message) => message.id !== 'welcome')
        .slice(-12)
        .map(({ role, content }) => ({ role, content }));

      const res = await fetch('/api/public/support-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, locale }),
      });

      const data = (await res.json()) as { reply?: string; error?: string };

      if (!res.ok) {
        if (res.status === 429) throw new Error(strings.errorRateLimit);
        if (res.status === 503) throw new Error(strings.errorNotConfigured);
        throw new Error(data.error || strings.errorGeneric);
      }
      if (!data.reply) {
        throw new Error(strings.errorGeneric);
      }

      setMessages((current) => [...current, { id: createId(), role: 'assistant', content: data.reply! }]);
    } catch (err) {
      const message = err instanceof Error ? err.message : strings.errorGeneric;
      setError(message);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void sendMessage(input);
  };

  return (
    <div
      className={`flex h-dvh max-h-dvh w-full flex-col overflow-hidden rounded-none border-0 bg-white shadow-none sm:h-[min(72dvh,520px)] sm:max-h-none sm:rounded-2xl sm:border sm:border-slate-200/90 sm:shadow-[0_20px_60px_-20px_rgba(14,21,72,0.35)] ${className}`}
    >
      <div className="flex items-center gap-3 border-b border-slate-100 bg-[#0E1548] px-4 py-3.5 pt-[max(0.875rem,env(safe-area-inset-top))] text-white">
        <span className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-xl ring-2 ring-white/20">
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
              className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
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
      </div>

      {error ? (
        <div className="border-t border-slate-100 bg-white px-3.5 py-2">
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
        </div>
      ) : null}

      <div className="border-t border-slate-100 bg-white px-3.5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mb-2.5 flex flex-wrap gap-1.5">
          {strings.suggestions.map((suggestion) => (
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

        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
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
            disabled={loading || !input.trim()}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0E1548] text-white transition hover:bg-[#141d5c] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={strings.send}
          >
            <FiSend className="h-4 w-4" aria-hidden />
          </button>
        </form>
      </div>
    </div>
  );
}
