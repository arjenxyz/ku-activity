import { APP_NAME } from '@/lib/brand';
import { getAppBaseUrl } from '@/lib/app-url';
import { formatString } from '@/lib/strings/format';
import strings from '@json/src/lib/personnel-reminder-email.json';

function buildHtml(name: string, count: number, panelUrl: string): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;">
        <tr><td style="background:linear-gradient(135deg,#2563eb,#4f46e5);padding:24px 28px;">
          <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;">${APP_NAME}</p>
          <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.85);">${strings.headerSubtitle}</p>
        </td></tr>
        <tr><td style="padding:28px;">
          <p style="margin:0 0 12px;font-size:15px;color:#334155;line-height:1.5;">${formatString(strings.greeting, { name })}</p>
          <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.5;">
            <strong>${count}</strong> ${strings.bodyHtmlSuffix}
          </p>
          <table role="presentation" width="100%"><tr><td align="center">
            <a href="${panelUrl}" style="display:inline-block;padding:14px 28px;background:#2563eb;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;border-radius:12px;">${strings.buttonLabel}</a>
          </td></tr></table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildText(name: string, count: number, panelUrl: string): string {
  return [
    formatString(strings.textTitle, { appName: APP_NAME }),
    '',
    formatString(strings.greeting, { name }),
    formatString(strings.textBody, { count }),
    formatString(strings.textPanel, { panelUrl }),
  ].join('\n');
}

export async function sendPersonnelPendingReminderEmail(
  email: string,
  name: string,
  pendingCount: number
): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME ?? APP_NAME;

  const panelUrl = `${getAppBaseUrl()}/personnel-panel?tab=work`;

  if (!apiKey || !senderEmail) {
    if (process.env.NODE_ENV === 'development') {
      console.info(`[reminder-dev] ${email}: ${pendingCount} bekleyen kayıt`);
      return;
    }
    throw new Error(strings.emailNotConfigured);
  }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: email.trim().toLowerCase() }],
      subject: formatString(strings.subject, { appName: APP_NAME }),
      htmlContent: buildHtml(name, pendingCount, panelUrl),
      textContent: buildText(name, pendingCount, panelUrl),
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(
      formatString(strings.sendFailed, {
        status: res.status,
        detail: detail ? `: ${detail.slice(0, 80)}` : '',
      })
    );
  }
}
