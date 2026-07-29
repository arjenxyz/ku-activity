/** AI destek /bug-report — Discord kanalına gönderim */

import { APP_NAME } from '@/lib/brand';
import type { Locale } from '@/lib/i18n/locale';
import { DISCORD_REPORT_GUILD_ID } from '@/lib/screen-report-discord';
import { stripScreenshotDataUrl } from '@/lib/screen-report-types';

/** AI raporları için ayrı kanal (ekran bildir kanalından farklı). */
export const DISCORD_AI_REPORT_CHANNEL_ID =
  process.env.DISCORD_AI_REPORT_CHANNEL_ID?.trim() || '1532066479699394690';

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

export type AiBugReportDiscordInput = {
  title: string;
  summary: string;
  originalReport: string;
  locale: Locale;
  category: string;
  githubIssueUrl?: string;
  screenshotBase64?: string;
  browserErrors?: string[];
};

export function isDiscordAiReportConfigured(): boolean {
  return Boolean(
    process.env.DISCORD_AI_REPORT_WEBHOOK_URL?.trim() ||
      process.env.DISCORD_BOT_TOKEN?.trim() ||
      process.env.DISCORD_REPORT_WEBHOOK_URL?.trim()
  );
}

function buildEmbed(input: AiBugReportDiscordInput) {
  const fields: Array<{ name: string; value: string; inline?: boolean }> = [
    { name: 'Locale', value: input.locale, inline: true },
    { name: 'Category', value: input.category, inline: true },
    {
      name: 'Screenshot',
      value: input.screenshotBase64 ? 'Attached' : 'Missing',
      inline: true,
    },
    { name: 'Summary', value: truncate(input.summary || '—', 1024) },
    { name: 'Steps / report', value: truncate(input.originalReport || '—', 1024) },
  ];

  if (input.browserErrors?.length) {
    fields.push({
      name: 'Browser errors',
      value: truncate(input.browserErrors.map((item, i) => `${i + 1}. ${item}`).join('\n'), 1024),
    });
  }

  if (input.githubIssueUrl) {
    fields.push({ name: 'GitHub', value: truncate(input.githubIssueUrl, 1024) });
  }

  return {
    title: truncate(input.title || 'Support chat bug report', 256),
    color: 0x0e1548,
    fields,
    footer: { text: `Guild ${DISCORD_REPORT_GUILD_ID} · channel ${DISCORD_AI_REPORT_CHANNEL_ID}` },
    timestamp: new Date().toISOString(),
  };
}

async function postDiscord(
  url: string,
  headers: HeadersInit,
  input: AiBugReportDiscordInput
): Promise<boolean> {
  const payload = {
    content: `🤖 **AI verified bug report** — ${APP_NAME}`,
    embeds: [buildEmbed(input)],
  };

  let res: Response;
  if (input.screenshotBase64?.startsWith('data:image/')) {
    const base64 = stripScreenshotDataUrl(input.screenshotBase64);
    const buffer = Buffer.from(base64, 'base64');
    const form = new FormData();
    form.append('payload_json', JSON.stringify(payload));
    form.append('files[0]', new Blob([buffer], { type: 'image/jpeg' }), `ai-bug-${Date.now()}.jpg`);
    res = await fetch(url, { method: 'POST', headers, body: form });
  } else {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(payload),
    });
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.error('[support-bug-report-discord] send failed', res.status, detail.slice(0, 300));
    return false;
  }
  return true;
}

/**
 * AI doğrulanmış bug raporunu Discord'a yollar.
 * Öncelik: AI webhook → bot + AI kanal → (yoksa) genel report webhook.
 */
export async function sendAiBugReportDiscord(input: AiBugReportDiscordInput): Promise<boolean> {
  const aiWebhook = process.env.DISCORD_AI_REPORT_WEBHOOK_URL?.trim();
  const botToken = process.env.DISCORD_BOT_TOKEN?.trim();
  const fallbackWebhook = process.env.DISCORD_REPORT_WEBHOOK_URL?.trim();

  if (aiWebhook) {
    return postDiscord(aiWebhook, {}, input);
  }

  if (botToken) {
    const url = `https://discord.com/api/v10/channels/${DISCORD_AI_REPORT_CHANNEL_ID}/messages`;
    return postDiscord(url, { Authorization: `Bot ${botToken}` }, input);
  }

  if (fallbackWebhook) {
    return postDiscord(fallbackWebhook, {}, input);
  }

  if (process.env.NODE_ENV === 'development') {
    console.info('[support-bug-report-discord-dev]', {
      channelId: DISCORD_AI_REPORT_CHANNEL_ID,
      guildId: DISCORD_REPORT_GUILD_ID,
      title: input.title,
      locale: input.locale,
      hasScreenshot: Boolean(input.screenshotBase64),
      errorCount: input.browserErrors?.length ?? 0,
    });
    return true;
  }

  return false;
}
