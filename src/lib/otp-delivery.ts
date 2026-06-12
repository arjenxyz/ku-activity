/** OTP gönderimi — Brevo e-posta */

import { APP_NAME } from '@/lib/brand';
import { buildContractOtpConfirmUrl } from '@/lib/app-url';

const OTP_SUBJECT = `${APP_NAME} — Başvuru doğrulama kodu`;

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const head = local.slice(0, 2);
  return `${head}***@${domain}`;
}

function buildOtpEmailHtml(code: string, linkToken: string, expiresMinutes: number): string {
  const confirmUrl = buildContractOtpConfirmUrl(linkToken);
  return `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08);">
        <tr><td style="background:linear-gradient(135deg,#2563eb,#4f46e5);padding:28px 32px;text-align:center;">
          <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">${APP_NAME}</p>
          <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.85);">Personel başvuru doğrulaması</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 8px;font-size:15px;color:#334155;line-height:1.5;">Başvurunuzu tamamlamak için doğrulama kodunuz:</p>
          <div style="margin:20px 0;padding:20px;background:#f8fafc;border:2px dashed #cbd5e1;border-radius:12px;text-align:center;">
            <p style="margin:0;font-size:36px;font-weight:800;letter-spacing:10px;color:#0f172a;font-family:ui-monospace,monospace;">${code}</p>
          </div>
          <p style="margin:0 0 20px;font-size:13px;color:#64748b;text-align:center;">Kodu kopyalayıp başvuru ekranına yapıştırabilirsiniz.</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr><td align="center" style="padding:8px 0 24px;">
              <a href="${confirmUrl}" style="display:inline-block;padding:14px 28px;background:#2563eb;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;border-radius:12px;">Başvurumu doğrula ve gönder</a>
            </td></tr>
          </table>
          <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;text-align:center;">
            Bu kod ve bağlantı <strong>${expiresMinutes} dakika</strong> geçerlidir.<br>
            İşlemi siz yapmadıysanız bu e-postayı yok sayın.
          </p>
        </td></tr>
        <tr><td style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;">${APP_NAME} · İnşaat personel yönetimi</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildOtpEmailText(code: string, linkToken: string, expiresMinutes: number): string {
  const confirmUrl = buildContractOtpConfirmUrl(linkToken);
  return [
    `${APP_NAME} — Başvuru doğrulama`,
    '',
    `Doğrulama kodunuz: ${code}`,
    '',
    `Tek tıkla onay ve gönderim: ${confirmUrl}`,
    '',
    `Bu kod ${expiresMinutes} dakika geçerlidir.`,
    'Bu işlemi siz yapmadıysanız bu e-postayı yok sayın.',
  ].join('\n');
}

export async function sendOtpEmail(
  email: string,
  code: string,
  linkToken: string,
  expiresMinutes: number
): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME ?? APP_NAME;

  if (!apiKey || !senderEmail) {
    if (process.env.NODE_ENV === 'development') {
      console.info(`[otp-dev] E-posta OTP ${email}: ${code}`);
      console.info(`[otp-dev] Link: ${buildContractOtpConfirmUrl(linkToken)}`);
      return;
    }
    throw new Error('E-posta doğrulama yapılandırılmamış (BREVO_API_KEY, BREVO_SENDER_EMAIL)');
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
      subject: OTP_SUBJECT,
      htmlContent: buildOtpEmailHtml(code, linkToken, expiresMinutes),
      textContent: buildOtpEmailText(code, linkToken, expiresMinutes),
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(
      `E-posta gönderilemedi (${res.status})${detail ? `: ${detail.slice(0, 120)}` : ''}`
    );
  }
}

export function isEmailOtpConfigured(): boolean {
  return Boolean(process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL);
}
