/** AI destek /bug-report — Discord kanalına gönderim */

import { APP_NAME } from '@/lib/brand';
import type { Locale } from '@/lib/i18n/locale';
import { DISCORD_REPORT_GUILD_ID } from '@/lib/screen-report-discord';

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
};

export function isDiscordAiReportConfigured(): boolean {
  return Boolean(
    process.env.DISCORD_AI_REPORT_WEBHOOK_URL?.trim() ||
      process.env.DISCORD_BOT_TOKEN?.trim() ||
      process.env.DISCORD_REPORT_WEBHOOK_URL?.trim()
  );
}

function buildPayload(input: AiBugReportDiscordInput) {
  const fields: Array<{ name: string; value: string; inline?: boolean }> = [
    { name: 'Locale', value: input.locale, inline: true },
    { name: 'Category', value: input.category, inline: true },
    { name: 'Summary', value: truncate(input.summary || '—', 1024) },
    { name: 'Original report', value: truncate(input.originalReport || '—', 1024) },
  ];

  if (input.githubIssueUrl) {
    fields.push({ name: 'GitHub', value: truncate(input.githubIssueUrl, 1024) });
  }

  return {
    content: `🤖 **AI verified bug report** — ${APP_NAME}`,
    embeds: [
      {
        title: truncate(input.title || 'Support chat bug report', 256),
        color: 0x0e1548,
        fields,
        footer: { text: `Guild ${DISCORD_REPORT_GUILD_ID} · channel ${DISCORD_AI_REPORT_CHANNEL_ID}` },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

async function postJson(url: string, headers: HeadersInit, body: unknown): Promise<boolean> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });

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
  const payload = buildPayload(input);

  if (aiWebhook) {
    return postJson(aiWebhook, {}, payload);
  }

  if (botToken) {
    const url = `https://discord.com/api/v10/channels/${DISCORD_AI_REPORT_CHANNEL_ID}/messages`;
    return postJson(url, { Authorization: `Bot ${botToken}` }, payload);
  }

  if (fallbackWebhook) {
    return postJson(fallbackWebhook, {}, payload);
  }

  if (process.env.NODE_ENV === 'development') {
    console.info('[support-bug-report-discord-dev]', {
      channelId: DISCORD_AI_REPORT_CHANNEL_ID,
      guildId: DISCORD_REPORT_GUILD_ID,
      title: input.title,
      locale: input.locale,
    });
    return true;
  }

  return false;
}
