import bcrypt from 'bcryptjs';
import { createAdminClient } from '@/utils/supabase/admin';
import { isEmailOtpConfigured, maskEmail, sendOtpEmail } from '@/lib/otp-delivery';
import type { ContractAcceptanceInput } from '@/lib/contract-service';
import { deleteOtpDraftPhoto, uploadOtpDraftPhoto } from '@/lib/registration-photo';
import { assertIdentityUnique, findPendingRegistrationIdForResubmit } from '@/lib/identity-uniqueness';
import { validateRegistrationDraft } from '@/lib/registration-draft-validation';
import {
  submitRegistrationFromOtpDraft,
  type OtpRegistrationDraft,
  type OtpSubmissionResult,
} from '@/lib/otp-registration';
import strings from '@json/src/lib/otp-service.json';
import { formatString } from '@/lib/strings/format';

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
    throw new Error(strings.quotaCheckFailed);
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
    throw new Error(strings.rateLimitCheckFailed);
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
  photo: File | null;
  userAgent?: string | null;
}): Promise<{ maskedDestination: string; expiresInMinutes: number; resumingPending?: boolean }> {
  const email = normalizeEmail(params.draft.email);
  if (!email.includes('@')) {
    throw new Error(strings.invalidEmail);
  }

  if (!isEmailOtpConfigured() && process.env.NODE_ENV !== 'development') {
    throw new Error(strings.emailNotConfigured);
  }

  if (!params.draft.contractAcceptances?.length) {
    throw new Error(strings.contractsMissing);
  }

  const draftError = validateRegistrationDraft({
    firstName: params.draft.firstName,
    lastName: params.draft.lastName,
    email: params.draft.email,
    phone: params.draft.phone ?? '',
    identityType: params.draft.identityType ?? 'tc',
    tcKimlik: params.draft.tcKimlik,
    birthDate: params.draft.birthDate,
    iban: params.draft.iban,
    pin: params.draft.pin,
  });
  if (draftError) {
    throw new Error(draftError);
  }

  const admin = createAdminClient();
  const pendingRegistrationId = await findPendingRegistrationIdForResubmit(admin, {
    email: params.draft.email,
    identityType: params.draft.identityType ?? 'tc',
    identityNumber: params.draft.identityNumber ?? params.draft.tcKimlik,
  });

  await assertIdentityUnique(admin, {
    email: params.draft.email,
    phone: params.draft.phone,
    identityType: params.draft.identityType ?? 'tc',
    identityNumber: params.draft.identityNumber ?? params.draft.tcKimlik,
    tcKimlik: params.draft.tcKimlik,
    iban: params.draft.iban,
    excludeRegistrationId: pendingRegistrationId ?? undefined,
  });

  const daily = await countDailySends();
  if (daily >= DAILY_OTP_SEND_LIMIT) {
    throw new Error(formatString(strings.dailyLimitReached, { limit: DAILY_OTP_SEND_LIMIT }));
  }

  const hourly = await countRecentSendsForDestination(email);
  if (hourly >= 3) {
    throw new Error(strings.tooFrequent);
  }

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);
  const linkToken = generateToken();
  const challengeId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString();

  const draftPhotoPath = params.photo ? await uploadOtpDraftPhoto(challengeId, params.photo) : null;

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
      identityType: params.draft.identityType ?? 'tc',
      identityNumber: params.draft.identityNumber ?? params.draft.tcKimlik,
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
    throw new Error(strings.createFailed);
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
    throw new Error(strings.updateFailed);
  }

  return {
    maskedDestination: maskEmail(email),
    expiresInMinutes: OTP_TTL_MINUTES,
    resumingPending: Boolean(pendingRegistrationId),
  };
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
    throw new Error(strings.alreadySubmitted);
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
    throw new Error(strings.invalidCodeFormat);
  }

  const admin = createAdminClient();
  const row = await loadActiveChallenge(admin, email);

  if (!row) {
    throw new Error(strings.noActiveChallenge);
  }

  if (row.submitted_at) {
    throw new Error(strings.alreadySubmitted);
  }

  if (new Date(row.expires_at).getTime() < Date.now()) {
    throw new Error(strings.codeExpired);
  }

  if (row.attempts >= MAX_VERIFY_ATTEMPTS) {
    throw new Error(strings.tooManyAttempts);
  }

  const valid = await bcrypt.compare(code, row.code_hash);
  if (!valid) {
    await admin
      .from('contract_otp_challenges')
      .update({ attempts: row.attempts + 1 })
      .eq('id', row.id);
    throw new Error(strings.codeInvalid);
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
    throw new Error(strings.draftNotFoundResubmit);
  }

  return result;
}

export async function confirmContractOtpLink(params: {
  linkToken: string;
  userAgent?: string | null;
}): Promise<OtpSubmissionResult> {
  const token = params.linkToken.trim();
  if (!token) {
    throw new Error(strings.invalidLink);
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
    throw new Error(strings.linkInvalidOrExpired);
  }

  const challenge = row as ChallengeRow;

  if (challenge.consumed_at || challenge.submitted_at) {
    throw new Error(strings.linkAlreadyUsed);
  }

  if (new Date(challenge.expires_at).getTime() < Date.now()) {
    throw new Error(strings.linkExpiredResend);
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
    throw new Error(strings.draftNotFound);
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
    throw new Error(strings.verificationInvalid);
  }
  if (row.consumed_at) {
    throw new Error(strings.codeAlreadyUsed);
  }
  if (!row.verified_at) {
    throw new Error(strings.verificationIncomplete);
  }
  if (row.email !== email) {
    throw new Error(strings.emailMismatch);
  }
  if (new Date(row.expires_at).getTime() < Date.now()) {
    throw new Error(strings.verificationExpired);
  }

  const { error: consumeError } = await admin
    .from('contract_otp_challenges')
    .update({ consumed_at: new Date().toISOString() })
    .eq('id', row.id);

  if (consumeError) {
    throw new Error(strings.verificationSaveFailed);
  }
}
