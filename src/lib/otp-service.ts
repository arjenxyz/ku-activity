import bcrypt from 'bcryptjs';
import { createAdminClient } from '@/utils/supabase/admin';
import { isEmailOtpConfigured, maskEmail, sendOtpEmail } from '@/lib/otp-delivery';
import type { ContractAcceptanceInput } from '@/lib/contract-service';
import { deleteOtpDraftPhoto, uploadOtpDraftPhoto } from '@/lib/registration-photo';
import {
  submitRegistrationFromOtpDraft,
  type OtpRegistrationDraft,
  type OtpSubmissionResult,
} from '@/lib/otp-registration';

export const OTP_LENGTH = 6;
export const OTP_TTL_MINUTES = 10;
export const OTP_TOKEN_TTL_MINUTES = 30;
export const DAILY_OTP_SEND_LIMIT = 20;
export const MAX_VERIFY_ATTEMPTS = 5;

type ChallengeRow = {
  id: string;
  email: string;
  code_hash: string;
  attempts: number;
  expires_at: string;
  verified_at: string | null;
  verification_token: string | null;
  consumed_at: string | null;
  submitted_at: string | null;
  link_token: string | null;
  draft_json: OtpRegistrationDraft | null;
  draft_photo_path: string | null;
  draft_contract_acceptances: ContractAcceptanceInput[] | null;
};

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
    .not('email_sent_at', 'is', null)
    .gte('email_sent_at', since);

  if (error) {
    if (error.message.includes('email_sent_at')) return 0;
    throw new Error('OTP kotası kontrol edilemedi');
  }
  return count ?? 0;
}

async function countRecentSendsForDestination(email: string): Promise<number> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error } = await admin
    .from('contract_otp_challenges')
    .select('id', { count: 'exact', head: true })
    .eq('email', email)
    .eq('channel', 'email')
    .not('email_sent_at', 'is', null)
    .gte('email_sent_at', since);

  if (error) {
    if (error.message.includes('email_sent_at')) return 0;
    throw new Error('OTP sıklık kontrolü başarısız');
  }
  return count ?? 0;
}

async function rollbackOtpChallenge(challengeId: string, draftPhotoPath: string | null) {
  const admin = createAdminClient();
  await admin.from('contract_otp_challenges').delete().eq('id', challengeId);
  await deleteOtpDraftPhoto(draftPhotoPath);
}

export async function prepareContractOtpRegistration(params: {
  draft: OtpRegistrationDraft;
  photo: File;
  userAgent?: string | null;
}): Promise<{ maskedDestination: string; expiresInMinutes: number }> {
  const email = normalizeEmail(params.draft.email);
  if (!email.includes('@')) {
    throw new Error('Geçerli bir e-posta adresi girin');
  }

  if (!isEmailOtpConfigured() && process.env.NODE_ENV !== 'development') {
    throw new Error('E-posta doğrulama servisi yapılandırılmamış');
  }

  if (!params.draft.contractAcceptances?.length) {
    throw new Error('Sözleşme onayları eksik');
  }

  const daily = await countDailySends();
  if (daily >= DAILY_OTP_SEND_LIMIT) {
    throw new Error(
      `Günlük doğrulama kodu limitine ulaşıldı (${DAILY_OTP_SEND_LIMIT}). Yarın tekrar deneyin.`
    );
  }

  const hourly = await countRecentSendsForDestination(email);
  if (hourly >= 3) {
    throw new Error('Çok sık kod istendi. Lütfen bir saat sonra tekrar deneyin.');
  }

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);
  const linkToken = generateToken();
  const challengeId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString();

  const draftPhotoPath = await uploadOtpDraftPhoto(challengeId, params.photo);

  const admin = createAdminClient();
  const { error: insertError } = await admin.from('contract_otp_challenges').insert({
    id: challengeId,
    channel: 'email',
    email,
    phone: params.draft.phone?.trim() || null,
    code_hash: codeHash,
    expires_at: expiresAt,
    link_token: linkToken,
    draft_json: {
      firstName: params.draft.firstName,
      lastName: params.draft.lastName,
      email: params.draft.email,
      phone: params.draft.phone,
      tcKimlik: params.draft.tcKimlik,
      birthDate: params.draft.birthDate,
      iban: params.draft.iban,
      pin: params.draft.pin,
      contractAcceptances: params.draft.contractAcceptances,
    },
    draft_photo_path: draftPhotoPath,
    draft_contract_acceptances: params.draft.contractAcceptances,
  });

  if (insertError) {
    throw new Error('Doğrulama kodu oluşturulamadı');
  }

  try {
    await sendOtpEmail(email, code, linkToken, OTP_TTL_MINUTES);
  } catch (err) {
    await rollbackOtpChallenge(challengeId, draftPhotoPath);
    throw err;
  }

  const { error: sentError } = await admin
    .from('contract_otp_challenges')
    .update({ email_sent_at: new Date().toISOString() })
    .eq('id', challengeId);

  if (sentError && !sentError.message.includes('email_sent_at')) {
    await rollbackOtpChallenge(challengeId, draftPhotoPath);
    throw new Error('Doğrulama kaydı güncellenemedi');
  }

  return { maskedDestination: maskEmail(email), expiresInMinutes: OTP_TTL_MINUTES };
}

async function loadActiveChallenge(
  admin: ReturnType<typeof createAdminClient>,
  email: string
): Promise<ChallengeRow | null> {
  const { data, error } = await admin
    .from('contract_otp_challenges')
    .select(
      'id, email, code_hash, attempts, expires_at, verified_at, verification_token, consumed_at, submitted_at, link_token, draft_json, draft_photo_path, draft_contract_acceptances'
    )
    .eq('email', email)
    .eq('channel', 'email')
    .is('consumed_at', null)
    .is('submitted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as ChallengeRow;
}

async function submitIfDraftReady(
  row: ChallengeRow,
  userAgent?: string | null
): Promise<OtpSubmissionResult | null> {
  if (!row.draft_json) return null;
  if (row.submitted_at) {
    throw new Error('Bu başvuru zaten gönderildi');
  }

  const draft: OtpRegistrationDraft = {
    ...row.draft_json,
    contractAcceptances:
      row.draft_contract_acceptances ?? row.draft_json.contractAcceptances ?? [],
  };

  return submitRegistrationFromOtpDraft({
    challengeId: row.id,
    draft,
    draftPhotoPath: row.draft_photo_path,
    userAgent,
  });
}

export async function verifyContractOtpAndSubmit(params: {
  email: string;
  code: string;
  userAgent?: string | null;
}): Promise<OtpSubmissionResult> {
  const email = normalizeEmail(params.email);
  const code = params.code.trim();
  if (!/^\d{6}$/.test(code)) {
    throw new Error('6 haneli doğrulama kodunu girin');
  }

  const admin = createAdminClient();
  const row = await loadActiveChallenge(admin, email);

  if (!row) {
    throw new Error('Geçerli bir doğrulama isteği bulunamadı. Önce kod gönderin.');
  }

  if (row.submitted_at) {
    throw new Error('Bu başvuru zaten gönderildi');
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

  await admin
    .from('contract_otp_challenges')
    .update({
      verified_at: new Date().toISOString(),
      verification_token: verificationToken,
      expires_at: verifiedExpires,
    })
    .eq('id', row.id);

  const result = await submitIfDraftReady(row, params.userAgent);
  if (!result) {
    throw new Error('Başvuru taslağı bulunamadı. Lütfen yeniden başvurun.');
  }

  return result;
}

export async function confirmContractOtpLink(params: {
  linkToken: string;
  userAgent?: string | null;
}): Promise<OtpSubmissionResult> {
  const token = params.linkToken.trim();
  if (!token) {
    throw new Error('Geçersiz doğrulama bağlantısı');
  }

  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from('contract_otp_challenges')
    .select(
      'id, email, code_hash, attempts, expires_at, verified_at, verification_token, consumed_at, submitted_at, link_token, draft_json, draft_photo_path, draft_contract_acceptances'
    )
    .eq('link_token', token)
    .maybeSingle();

  if (error || !row) {
    throw new Error('Doğrulama bağlantısı geçersiz veya süresi dolmuş');
  }

  const challenge = row as ChallengeRow;

  if (challenge.consumed_at || challenge.submitted_at) {
    throw new Error('Bu bağlantı zaten kullanıldı');
  }

  if (new Date(challenge.expires_at).getTime() < Date.now()) {
    throw new Error('Doğrulama bağlantısının süresi doldu. Yeni kod isteyin.');
  }

  if (!challenge.verified_at) {
    const verificationToken = generateToken();
    const verifiedExpires = new Date(Date.now() + OTP_TOKEN_TTL_MINUTES * 60 * 1000).toISOString();
    await admin
      .from('contract_otp_challenges')
      .update({
        verified_at: new Date().toISOString(),
        verification_token: verificationToken,
        expires_at: verifiedExpires,
      })
      .eq('id', challenge.id);
  }

  const result = await submitIfDraftReady(challenge, params.userAgent);
  if (!result) {
    throw new Error('Başvuru taslağı bulunamadı');
  }

  return result;
}

/** @deprecated Eski akış — artık prepare + verify kullanılıyor */
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
