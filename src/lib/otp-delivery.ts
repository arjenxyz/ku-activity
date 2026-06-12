/** OTP gönderimi — Brevo (e-posta, ücretsiz 300/gün) + isteğe bağlı Twilio SMS */

export type OtpChannel = 'email' | 'sms';

const OTP_SUBJECT = 'Sözleşme onay doğrulama kodu';

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const head = local.slice(0, 2);
  return `${head}***@${domain}`;
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '***';
  return `***${digits.slice(-4)}`;
}

export function formatTurkeyE164(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10 && digits.startsWith('5')) return `+90${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `+90${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith('90')) return `+${digits}`;
  if (phone.startsWith('+90') && digits.length === 12) return `+${digits}`;
  return null;
}

export async function sendOtpEmail(email: string, code: string): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME ?? 'CrewLedger';

  if (!apiKey || !senderEmail) {
    if (process.env.NODE_ENV === 'development') {
      console.info(`[otp-dev] E-posta OTP ${email}: ${code}`);
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
      textContent: [
        `Doğrulama kodunuz: ${code}`,
        '',
        'Bu kod 10 dakika geçerlidir.',
        'Başvuru sırasında sözleşme onayınızı doğrulamak için kullanılır.',
        'Bu işlemi siz yapmadıysanız bu e-postayı yok sayın.',
      ].join('\n'),
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`E-posta gönderilemedi (${res.status})${detail ? `: ${detail.slice(0, 120)}` : ''}`);
  }
}

export async function sendOtpSms(phoneE164: string, code: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_SMS_FROM;

  if (!accountSid || !authToken || !from) {
    throw new Error(
      'SMS doğrulama yapılandırılmamış. E-posta ile doğrulamayı seçin veya TWILIO_* ortam değişkenlerini tanımlayın.'
    );
  }

  const body = new URLSearchParams({
    To: phoneE164,
    From: from,
    Body: `CrewLedger contract verification code: ${code} (valid 10 min)`,
  });

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    }
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`SMS gönderilemedi${detail ? `: ${detail.slice(0, 160)}` : ''}`);
  }
}

export async function deliverOtp(params: {
  channel: OtpChannel;
  email: string;
  phone?: string | null;
  code: string;
}): Promise<{ maskedDestination: string }> {
  if (params.channel === 'email') {
    await sendOtpEmail(params.email, params.code);
    return { maskedDestination: maskEmail(params.email) };
  }

  const e164 = formatTurkeyE164(params.phone ?? '');
  if (!e164) {
    throw new Error('Geçerli bir cep telefonu numarası girin (5xx xxx xx xx)');
  }
  await sendOtpSms(e164, params.code);
  return { maskedDestination: maskPhone(e164) };
}

export function isEmailOtpConfigured(): boolean {
  return Boolean(process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL);
}

export function isSmsOtpConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_SMS_FROM
  );
}
