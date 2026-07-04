/** Ekran raporu — Discord kanalına gönderim */

import { APP_NAME } from '@/lib/brand';
import type { ScreenReportInput } from '@/lib/screen-report-types';
import { stripScreenshotDataUrl } from '@/lib/screen-report-types';
import strings from '@json/src/lib/screen-report-discord.json';
import { formatString } from '@/lib/strings/format';

/** CrewLedger Discord sunucusu / rapor kanalı */
export const DISCORD_REPORT_GUILD_ID = '1465698764453838882';
export const DISCORD_REPORT_CHANNEL_ID =
  process.env.DISCORD_REPORT_CHANNEL_ID ?? '1522557902278365184';

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

function buildEmbed(input: ScreenReportInput) {
  const fields: Array<{ name: string; value: string; inline?: boolean }> = [
    { name: strings.embedScreen, value: input.screenLabel ?? strings.embedScreenDefault, inline: true },
    { name: strings.embedTime, value: input.capturedAt, inline: true },
    { name: strings.embedPage, value: truncate(input.pageUrl || '—', 1024) },
    { name: strings.embedBrowser, value: truncate(input.userAgent || '—', 1024) },
  ];

  if (input.formError) {
    fields.push({ name: strings.embedFormError, value: truncate(input.formError, 1024) });
  }
  if (input.note) {
    fields.push({ name: strings.embedUserNote, value: truncate(input.note, 1024) });
  }

  const diag =
    input.diagnostics && input.diagnostics.length > 0
      ? input.diagnostics.map((d) => `• ${d}`).join('\n')
      : '—';

  fields.push({ name: strings.embedDiagnostics, value: truncate(diag, 1024) });

  return {
    title: formatString(strings.reportTitle, { appName: APP_NAME }),
    color: 0x2563eb,
    fields,
    footer: { text: `Guild ${DISCORD_REPORT_GUILD_ID}` },
    timestamp: input.capturedAt,
  };
}

async function postDiscordMessage(url: string, headers: HeadersInit, input: ScreenReportInput) {
  const base64 = stripScreenshotDataUrl(input.screenshotBase64);
  const buffer = Buffer.from(base64, 'base64');
  const filename = `crewledger-screen-${Date.now()}.jpg`;

  const form = new FormData();
  form.append(
    'payload_json',
    JSON.stringify({
      content: strings.newReportContent,
      embeds: [buildEmbed(input)],
    })
  );
  form.append('files[0]', new Blob([buffer], { type: 'image/jpeg' }), filename);

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: form,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(
      formatString(strings.sendFailed, {
        status: res.status,
        detail: detail ? `: ${detail.slice(0, 200)}` : '',
      })
    );
  }
}

export function isDiscordReportConfigured(): boolean {
  return Boolean(process.env.DISCORD_REPORT_WEBHOOK_URL || process.env.DISCORD_BOT_TOKEN);
}

export async function sendScreenReportDiscord(input: ScreenReportInput): Promise<void> {
  const webhook = process.env.DISCORD_REPORT_WEBHOOK_URL?.trim();
  const botToken = process.env.DISCORD_BOT_TOKEN?.trim();

  if (webhook) {
    await postDiscordMessage(webhook, {}, input);
    return;
  }

  if (botToken) {
    const url = `https://discord.com/api/v10/channels/${DISCORD_REPORT_CHANNEL_ID}/messages`;
    await postDiscordMessage(url, { Authorization: `Bot ${botToken}` }, input);
    return;
  }

  if (process.env.NODE_ENV === 'development') {
    console.info('[screen-report-discord-dev]', {
      channelId: DISCORD_REPORT_CHANNEL_ID,
      guildId: DISCORD_REPORT_GUILD_ID,
      pageUrl: input.pageUrl,
      formError: input.formError,
      note: input.note,
      screenshotBytes: stripScreenshotDataUrl(input.screenshotBase64).length,
    });
    return;
  }

  throw new Error(strings.notConfigured);
}
