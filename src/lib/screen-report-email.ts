/** Ekran raporu — Brevo ile geliştirici e-postası (Discord yoksa yedek) */

import { APP_NAME, DEFAULT_SUPPORT_EMAIL } from '@/lib/brand';
import type { ScreenReportInput } from '@/lib/screen-report-types';
import { stripScreenshotDataUrl } from '@/lib/screen-report-types';
import { formatString } from '@/lib/strings/format';
import strings from '@json/src/lib/screen-report-email.json';

export type { ScreenReportInput };

function reportRecipient(): string {
  return (
    process.env.DEVELOPER_REPORT_EMAIL ||
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL ||
    DEFAULT_SUPPORT_EMAIL
  );
}

function buildReportHtml(input: ScreenReportInput): string {
  const diag =
    input.diagnostics && input.diagnostics.length > 0
      ? input.diagnostics.map((d) => `<li>${escapeHtml(d)}</li>`).join('')
      : `<li>${strings.noDiagnostics}</li>`;

  const screenLabel = input.screenLabel ?? strings.defaultScreenLabel;

  return `<!DOCTYPE html>
<html lang="tr"><body style="font-family:system-ui,sans-serif;color:#0f172a;">
  <h2 style="margin:0 0 12px;">${formatString(strings.title, { appName: APP_NAME })}</h2>
  <p><strong>${strings.screenLabel}</strong> ${escapeHtml(screenLabel)}</p>
  <p><strong>${strings.pageLabel}</strong> ${escapeHtml(input.pageUrl)}</p>
  <p><strong>${strings.timeLabel}</strong> ${escapeHtml(input.capturedAt)}</p>
  <p><strong>${strings.browserLabel}</strong> ${escapeHtml(input.userAgent.slice(0, 500))}</p>
  ${
    input.formError
      ? `<p><strong>${strings.formErrorLabel}</strong> ${escapeHtml(input.formError)}</p>`
      : ''
  }
  ${
    input.note
      ? `<p><strong>${strings.userNoteLabel}</strong> ${escapeHtml(input.note)}</p>`
      : ''
  }
  <h3 style="margin:20px 0 8px;">${strings.diagnosticsTitle}</h3>
  <ul>${diag}</ul>
  <p style="margin-top:24px;font-size:12px;color:#64748b;">${strings.screenshotNote}</p>
</body></html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildReportText(input: ScreenReportInput): string {
  const screenLabel = input.screenLabel ?? strings.defaultScreenLabel;

  return [
    formatString(strings.title, { appName: APP_NAME }),
    '',
    `${strings.screenLabel} ${screenLabel}`,
    `${strings.pageLabel} ${input.pageUrl}`,
    `${strings.timeLabel} ${input.capturedAt}`,
    `${strings.browserLabel} ${input.userAgent}`,
    input.formError ? `${strings.formErrorLabel} ${input.formError}` : '',
    input.note ? `${strings.userNoteLabel} ${input.note}` : '',
    '',
    `${strings.diagnosticsTitle}:`,
    ...(input.diagnostics?.length ? input.diagnostics : [strings.textDiagnosticsNone]),
    '',
    strings.screenshotNote,
  ]
    .filter(Boolean)
    .join('\n');
}

export async function sendScreenReportEmail(input: ScreenReportInput): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME ?? APP_NAME;
  const to = reportRecipient();

  if (!apiKey || !senderEmail) {
    if (process.env.NODE_ENV === 'development') {
      console.info('[screen-report-dev]', {
        to,
        pageUrl: input.pageUrl,
        formError: input.formError,
        note: input.note,
        screenshotBytes: stripScreenshotDataUrl(input.screenshotBase64).length,
      });
      return;
    }
    throw new Error(strings.emailNotConfigured);
  }

  const screenLabel = input.screenLabel ?? strings.defaultScreenLabel;

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: to }],
      subject: formatString(strings.subjectSuffix, { appName: APP_NAME, screenLabel }),
      htmlContent: buildReportHtml(input),
      textContent: buildReportText(input),
      attachment: [
        {
          name: `crewledger-screen-${Date.now()}.jpg`,
          content: stripScreenshotDataUrl(input.screenshotBase64),
        },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(
      formatString(strings.sendFailed, {
        status: res.status,
        detail: detail ? `: ${detail.slice(0, 120)}` : '',
      })
    );
  }
}
