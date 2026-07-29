import 'server-only';

import type { Locale } from '@/lib/i18n/locale';
import {
  SupportChatError,
  generateSupportChatReply,
  type SupportChatMessage,
} from '@/lib/support-chat';
import {
  isDiscordAiReportConfigured,
  sendAiBugReportDiscord,
} from '@/lib/support-bug-report-discord';

export type BugReportCategory = 'bug' | 'feature' | 'question' | 'spam' | 'insufficient';

export type BugReportTicket = {
  filed: boolean;
  number?: number;
  url?: string;
  discord?: boolean;
  reason?: 'not_verified' | 'not_configured' | 'create_failed';
};

export type BugReportResult = {
  reply: string;
  suggestedFollowUps: string[];
  ticket: BugReportTicket;
};

type VerificationPayload = {
  verified: boolean;
  category: BugReportCategory;
  title: string;
  summary: string;
  userReply: string;
  suggestedFollowUps: string[];
};

const CATEGORIES = new Set<BugReportCategory>([
  'bug',
  'feature',
  'question',
  'spam',
  'insufficient',
]);

function getGeminiApiKey(): string | null {
  const key =
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    process.env.GOOGLE_API_KEY?.trim();
  return key || null;
}

function getPreferredModel(): string {
  return process.env.GEMINI_MODEL?.trim() || 'gemini-3.5-flash-lite';
}

function modelCandidates(): string[] {
  const preferred = getPreferredModel();
  const fallbacks = ['gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-flash-latest'];
  const seen = new Set<string>();
  const list: string[] = [];
  for (const model of [preferred, ...fallbacks]) {
    if (!model || seen.has(model)) continue;
    seen.add(model);
    list.push(model);
  }
  return list;
}

function githubConfig() {
  const token =
    process.env.GITHUB_BUG_REPORTS_TOKEN?.trim() ||
    process.env.GITHUB_TOKEN?.trim() ||
    process.env.GH_TOKEN?.trim() ||
    '';
  const repo = process.env.GITHUB_REPO?.trim() || 'arjenxyz/personel';
  return { token, repo };
}

export function isBugReportDeliveryConfigured(): boolean {
  return isDiscordAiReportConfigured() || isBugReportGithubConfigured();
}

/** @deprecated use isBugReportDeliveryConfigured */
export function isBugReportGithubConfigured(): boolean {
  return Boolean(githubConfig().token);
}

function extractReportBody(content: string): string {
  return content.replace(/^\[BUG REPORT\]\s*/i, '').trim();
}

function sanitizeFollowUps(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const items: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (typeof item !== 'string') continue;
    const trimmed = item.trim().replace(/\s+/g, ' ');
    if (!trimmed || trimmed.length > 120) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(trimmed);
    if (items.length >= 4) break;
  }
  return items;
}

function parseVerification(text: string): VerificationPayload | null {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const tryParse = (raw: string): VerificationPayload | null => {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const categoryRaw = typeof parsed.category === 'string' ? parsed.category.toLowerCase() : '';
      const category = CATEGORIES.has(categoryRaw as BugReportCategory)
        ? (categoryRaw as BugReportCategory)
        : 'insufficient';
      const userReply = typeof parsed.userReply === 'string' ? parsed.userReply.trim() : '';
      if (!userReply) return null;
      return {
        verified: Boolean(parsed.verified) && category === 'bug',
        category,
        title:
          typeof parsed.title === 'string' && parsed.title.trim()
            ? parsed.title.trim().slice(0, 120)
            : 'Support chat bug report',
        summary:
          typeof parsed.summary === 'string' && parsed.summary.trim()
            ? parsed.summary.trim().slice(0, 4000)
            : userReply.slice(0, 4000),
        userReply,
        suggestedFollowUps: sanitizeFollowUps(parsed.suggestedFollowUps),
      };
    } catch {
      return null;
    }
  };

  return tryParse(cleaned) ?? (() => {
    const match = cleaned.match(/\{[\s\S]*\}/);
    return match ? tryParse(match[0]) : null;
  })();
}

async function verifyWithGemini(
  reportText: string,
  locale: Locale,
  history: SupportChatMessage[]
): Promise<VerificationPayload> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new SupportChatError('NOT_CONFIGURED', 'SUPPORT_CHAT_NOT_CONFIGURED');
  }

  const languageHint =
    locale === 'tr'
      ? 'userReply and suggestedFollowUps must be Turkish.'
      : `userReply and suggestedFollowUps must match locale "${locale}" / the user's language.`;

  const system = `You triage CrewLedger support bug reports for developers.

${languageHint}

Decide if the report is a real product bug worth a GitHub issue.

verified=true ONLY when category is "bug" and there is a concrete reproducible product problem.
Use:
- bug: concrete malfunction (crash, wrong data, broken flow)
- feature: enhancement request (not a bug)
- question: how-to / support question
- spam: abuse / nonsense
- insufficient: too vague to act on

title and summary must be English (for developers).
userReply is what the end user sees.

Return ONLY JSON:
{
  "verified": boolean,
  "category": "bug" | "feature" | "question" | "spam" | "insufficient",
  "title": "short English GitHub issue title",
  "summary": "English developer summary with steps/impact if available",
  "userReply": "localized reply to the user",
  "suggestedFollowUps": ["short follow-up 1", "short follow-up 2"]
}`;

  const recent = history
    .slice(-8)
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n');

  const userPrompt = `Locale: ${locale}

Recent chat:
${recent || '(none)'}

Bug report text:
${reportText}`;

  let lastError: SupportChatError | null = null;

  for (const model of modelCandidates()) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 2048,
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      const raw = await res.text().catch(() => '');
      if (!res.ok) {
        if (res.status === 404 || res.status === 503 || res.status === 500) {
          lastError = new SupportChatError(
            res.status === 404 ? 'MODEL' : 'UNAVAILABLE',
            `GEMINI_ERROR:${res.status}`,
            res.status
          );
          continue;
        }
        if (res.status === 429) {
          throw new SupportChatError('QUOTA', `GEMINI_ERROR:${res.status}`, res.status);
        }
        if (res.status === 401 || res.status === 403) {
          throw new SupportChatError('AUTH', `GEMINI_ERROR:${res.status}`, res.status);
        }
        throw new SupportChatError('UPSTREAM', `GEMINI_ERROR:${res.status}`, res.status);
      }

      type GeminiGenerateResponse = {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };

      let data: GeminiGenerateResponse | null = null;
      try {
        data = raw ? (JSON.parse(raw) as GeminiGenerateResponse) : null;
      } catch {
        data = null;
      }

      const text = data?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? '')
        .join('')
        .trim();
      if (!text) {
        lastError = new SupportChatError('EMPTY', 'GEMINI_EMPTY', res.status);
        continue;
      }

      const parsed = parseVerification(text);
      if (parsed) return parsed;

      lastError = new SupportChatError('EMPTY', 'GEMINI_EMPTY', res.status);
    } catch (err) {
      if (err instanceof SupportChatError) {
        if (err.code === 'MODEL' || err.code === 'UNAVAILABLE' || err.code === 'EMPTY') {
          lastError = err;
          continue;
        }
        throw err;
      }
      throw err;
    }
  }

  throw lastError ?? new SupportChatError('UPSTREAM', 'GEMINI_ERROR:unknown');
}

async function createGithubIssue(params: {
  title: string;
  summary: string;
  originalReport: string;
  locale: Locale;
}): Promise<{ number: number; url: string } | null> {
  const { token, repo } = githubConfig();
  if (!token) return null;

  const labelsEnv = process.env.GITHUB_BUG_REPORT_LABELS?.trim();
  const labels = labelsEnv
    ? labelsEnv
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 5)
    : ['ai-verified'];

  const body = [
    '## AI-verified support bug report',
    '',
    '### Summary',
    params.summary,
    '',
    '### Original user report',
    params.originalReport,
    '',
    '### Meta',
    `- Locale: \`${params.locale}\``,
    '- Source: public support chat (`/bug-report`)',
    '- Verified by Gemini triage',
  ].join('\n');

  const payload: { title: string; body: string; labels?: string[] } = {
    title: `[AI] ${params.title}`.slice(0, 200),
    body,
  };
  if (labels.length) payload.labels = labels;

  const post = async (withLabels: boolean) => {
    const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'User-Agent': 'CrewLedger-SupportBugReports',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(withLabels ? payload : { title: payload.title, body: payload.body }),
    });
    return res;
  };

  let res = await post(Boolean(labels.length));
  if (!res.ok && labels.length && (res.status === 422 || res.status === 410)) {
    res = await post(false);
  }

  if (!res.ok) {
    console.error('[support-bug-report] GitHub issue failed', res.status, await res.text().catch(() => ''));
    return null;
  }

  const data = (await res.json()) as { number?: number; html_url?: string };
  if (!data.number || !data.html_url) return null;
  return { number: data.number, url: data.html_url };
}

function filedSuffix(locale: Locale, opts: { issueNumber?: number; discord?: boolean }): string {
  if (locale === 'tr') {
    if (opts.issueNumber) {
      return `\n\nRaporunuz geliştiriciye iletildi (#${opts.issueNumber}).`;
    }
    if (opts.discord) {
      return '\n\nRaporunuz geliştiriciye iletildi.';
    }
    return '';
  }
  if (opts.issueNumber) {
    return `\n\nYour report was sent to the developer (#${opts.issueNumber}).`;
  }
  if (opts.discord) {
    return '\n\nYour report was sent to the developer.';
  }
  return '';
}

/**
 * Triage a `[BUG REPORT]` message. If Gemini verifies a real bug, notify the developer
 * via Discord (AI reports channel) and optionally open a GitHub issue.
 */
export async function handleSupportBugReport(
  messages: SupportChatMessage[],
  locale: Locale
): Promise<BugReportResult> {
  const last = messages[messages.length - 1];
  const originalReport = extractReportBody(last?.content ?? '');
  if (!originalReport) {
    return {
      reply:
        locale === 'tr'
          ? 'Hata bildirimi için lütfen sorunu kısaca yazın.'
          : 'Please briefly describe the bug to report it.',
      suggestedFollowUps: [],
      ticket: { filed: false, reason: 'not_verified' },
    };
  }

  let verification: VerificationPayload;
  try {
    verification = await verifyWithGemini(originalReport, locale, messages.slice(0, -1));
  } catch (err) {
    // Fallback: still answer via normal support chat so the user is not stuck.
    if (err instanceof SupportChatError) throw err;
    const fallback = await generateSupportChatReply(messages, locale);
    return {
      reply: fallback.reply,
      suggestedFollowUps: fallback.suggestedFollowUps,
      ticket: { filed: false, reason: 'create_failed' },
    };
  }

  if (!verification.verified) {
    return {
      reply: verification.userReply,
      suggestedFollowUps: verification.suggestedFollowUps,
      ticket: { filed: false, reason: 'not_verified' },
    };
  }

  if (!isBugReportDeliveryConfigured()) {
    return {
      reply: verification.userReply,
      suggestedFollowUps: verification.suggestedFollowUps,
      ticket: { filed: false, reason: 'not_configured' },
    };
  }

  const issue = isBugReportGithubConfigured()
    ? await createGithubIssue({
        title: verification.title,
        summary: verification.summary,
        originalReport,
        locale,
      })
    : null;

  const discordOk = isDiscordAiReportConfigured()
    ? await sendAiBugReportDiscord({
        title: verification.title,
        summary: verification.summary,
        originalReport,
        locale,
        category: verification.category,
        githubIssueUrl: issue?.url,
      })
    : false;

  if (!discordOk && !issue) {
    return {
      reply: verification.userReply,
      suggestedFollowUps: verification.suggestedFollowUps,
      ticket: { filed: false, reason: 'create_failed' },
    };
  }

  return {
    reply: `${verification.userReply.trim()}${filedSuffix(locale, {
      issueNumber: issue?.number,
      discord: discordOk,
    })}`,
    suggestedFollowUps: verification.suggestedFollowUps,
    ticket: {
      filed: true,
      number: issue?.number,
      url: issue?.url,
      discord: discordOk,
    },
  };
}

export function isBugReportMessage(content: string): boolean {
  return /^\s*\[BUG REPORT\]/i.test(content);
}
