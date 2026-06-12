import bcrypt from 'bcryptjs';
import { createAdminClient } from '@/utils/supabase/admin';
import {
  deliverOtp,
  isEmailOtpConfigured,
  isSmsOtpConfigured,
  type OtpChannel,
} from '@/lib/otp-delivery';

export const OTP_LENGTH = 6;
export const OTP_TTL_MINUTES = 10;
export const OTP_TOKEN_TTL_MINUTES = 30;
export const DAILY_OTP_SEND_LIMIT = 20;
export const MAX_VERIFY_ATTEMPTS = 5;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function generateCode(): string {
  const n = Math.floor(Math.random() * 1_000_000);
  return String(n).padStart(OTP_LENGTH, '0');
}

function generateToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function countDailySends(): Promise<number> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await admin
    .from('contract_otp_challenges')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', since);

  if (error) throw new Error('OTP kotası kontrol edilemedi');
  return count ?? 0;
}

async function countRecentSendsForDestination(email: string, channel: OtpChannel): Promise<number> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error } = await admin
    .from('contract_otp_challenges')
    .select('id', { count: 'exact', head: true })
    .eq('email', email)
    .eq('channel', channel)
    .gte('created_at', since);

  if (error) throw new Error('OTP sıklık kontrolü başarısız');
  return count ?? 0;
}

export async function sendContractOtp(params: {
  channel: OtpChannel;
  email: string;
  phone?: string | null;
}): Promise<{ maskedDestination: string; expiresInMinutes: number }> {
  const email = normalizeEmail(params.email);
  if (!email.includes('@')) {
    throw new Error('Geçerli bir e-posta adresi girin');
  }

  if (params.channel === 'email' && !isEmailOtpConfigured() && process.env.NODE_ENV !== 'development') {
    throw new Error('E-posta doğrulama servisi yapılandırılmamış');
  }
  if (params.channel === 'sms' && !isSmsOtpConfigured()) {
    throw new Error('SMS doğrulama servisi yapılandırılmamış. E-posta ile deneyin.');
  }

  const daily = await countDailySends();
  if (daily >= DAILY_OTP_SEND_LIMIT) {
    throw new Error(
      `Günlük doğrulama kodu limitine ulaşıldı (${DAILY_OTP_SEND_LIMIT}). Yarın tekrar deneyin.`
    );
  }

  const hourly = await countRecentSendsForDestination(email, params.channel);
  if (hourly >= 3) {
    throw new Error('Çok sık kod istendi. Lütfen bir saat sonra tekrar deneyin.');
  }

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString();

  const admin = createAdminClient();
  const { error: insertError } = await admin.from('contract_otp_challenges').insert({
    channel: params.channel,
    email,
    phone: params.phone?.trim() || null,
    code_hash: codeHash,
    expires_at: expiresAt,
  });

  if (insertError) {
    throw new Error('Doğrulama kodu oluşturulamadı');
  }

  const { maskedDestination } = await deliverOtp({
    channel: params.channel,
    email,
    phone: params.phone,
    code,
  });

  return { maskedDestination, expiresInMinutes: OTP_TTL_MINUTES };
}

export async function verifyContractOtp(params: {
  channel: OtpChannel;
  email: string;
  code: string;
}): Promise<{ verificationToken: string; expiresInMinutes: number }> {
  const email = normalizeEmail(params.email);
  const code = params.code.trim();
  if (!/^\d{6}$/.test(code)) {
    throw new Error('6 haneli doğrulama kodunu girin');
  }

  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from('contract_otp_challenges')
    .select('id, code_hash, attempts, expires_at, verified_at, verification_token')
    .eq('email', email)
    .eq('channel', params.channel)
    .is('consumed_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !row) {
    throw new Error('Geçerli bir doğrulama isteği bulunamadı. Önce kod gönderin.');
  }

  if (row.verified_at && row.verification_token) {
    return {
      verificationToken: row.verification_token,
      expiresInMinutes: OTP_TOKEN_TTL_MINUTES,
    };
  }

  if (new Date(row.expires_at).getTime() < Date.now()) {
    throw new Error('Doğrulama kodunun süresi doldu. Yeni kod isteyin.');
  }

  if (row.attempts >= MAX_VERIFY_ATTEMPTS) {
    throw new Error('Çok fazla hatalı deneme. Yeni kod isteyin.');
  }

  const valid = await bcrypt.compare(code, row.code_hash);
  if (!valid) {
    await admin
      .from('contract_otp_challenges')
      .update({ attempts: row.attempts + 1 })
      .eq('id', row.id);
    throw new Error('Doğrulama kodu hatalı');
  }

  const verificationToken = generateToken();
  const verifiedExpires = new Date(Date.now() + OTP_TOKEN_TTL_MINUTES * 60 * 1000).toISOString();

  const { error: updateError } = await admin
    .from('contract_otp_challenges')
    .update({
      verified_at: new Date().toISOString(),
      verification_token: verificationToken,
      expires_at: verifiedExpires,
    })
    .eq('id', row.id);

  if (updateError) {
    throw new Error('Doğrulama tamamlanamadı');
  }

  return { verificationToken, expiresInMinutes: OTP_TOKEN_TTL_MINUTES };
}

export async function consumeContractOtpToken(params: {
  verificationToken: string;
  email: string;
}): Promise<void> {
  const email = normalizeEmail(params.email);
  const admin = createAdminClient();

  const { data: row, error } = await admin
    .from('contract_otp_challenges')
    .select('id, email, verified_at, expires_at, consumed_at')
    .eq('verification_token', params.verificationToken)
    .maybeSingle();

  if (error || !row) {
    throw new Error('Sözleşme doğrulaması geçersiz. OTP adımını tekrarlayın.');
  }
  if (row.consumed_at) {
    throw new Error('Bu doğrulama kodu zaten kullanıldı');
  }
  if (!row.verified_at) {
    throw new Error('Doğrulama tamamlanmamış');
  }
  if (row.email !== email) {
    throw new Error('Doğrulama e-postası başvuru ile eşleşmiyor');
  }
  if (new Date(row.expires_at).getTime() < Date.now()) {
    throw new Error('Doğrulama süresi doldu. Yeni kod alın.');
  }

  const { error: consumeError } = await admin
    .from('contract_otp_challenges')
    .update({ consumed_at: new Date().toISOString() })
    .eq('id', row.id);

  if (consumeError) {
    throw new Error('Doğrulama kaydedilemedi');
  }
}
