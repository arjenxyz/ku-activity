import 'server-only';
import bcrypt from 'bcryptjs';
import { createAdminClient } from '@/utils/supabase/admin';
import { isEmailOtpConfigured, maskEmail } from '@/lib/otp-delivery';
import { buildClosureAccelerationConfirmUrl } from '@/lib/app-url';
import { APP_NAME } from '@/lib/brand';
import { formatString } from '@/lib/strings/format';
import strings from '@json/src/lib/closure-deletion-acceleration.json';

export const ACCELERATION_OTP_LENGTH = 6;
export const ACCELERATION_OTP_TTL_MINUTES = 10;
export const ACCELERATION_DELETION_MINUTES = 3;
export const ACCELERATION_MAX_VERIFY_ATTEMPTS = 5;
export const ACCELERATION_HOURLY_SEND_LIMIT = 3;

type ChallengeRow = {
  id: string;
  project_id: string;
  employee_id: string;
  email: string;
  code_hash: string;
  attempts: number;
  expires_at: string;
  verified_at: string | null;
  consumed_at: string | null;
  link_token: string;
};

function generateCode(): string {
  const n = Math.floor(Math.random() * 1_000_000);
  return String(n).padStart(ACCELERATION_OTP_LENGTH, '0');
}

function generateToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function countRecentSendsForEmployee(employeeId: string): Promise<number> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error } = await admin
    .from('personnel_closure_acceleration_otp')
    .select('id', { count: 'exact', head: true })
    .eq('employee_id', employeeId)
    .not('email_sent_at', 'is', null)
    .gte('email_sent_at', since);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function assertCanAccelerate(projectId: string, employeeId: string) {
  const admin = createAdminClient();

  const { data: project } = await admin
    .from('projects')
    .select('closure_phase')
    .eq('id', projectId)
    .maybeSingle();

  const phase = project?.closure_phase ?? 'none';
  if (phase !== 'pending_consents' && phase !== 'export_window') {
    throw new Error('CLOSURE_NOT_ACTIVE');
  }

  const { data: consent } = await admin
    .from('project_closure_consents')
    .select(
      'consented_at, data_exported_at, data_export_acknowledged_at, accelerated_deletion_at'
    )
    .eq('project_id', projectId)
    .eq('employee_id', employeeId)
    .maybeSingle();

  if (!consent?.consented_at) throw new Error('CONSENT_REQUIRED');
  if (!consent.data_exported_at) throw new Error('DOWNLOAD_REQUIRED');
  if (!consent.data_export_acknowledged_at) throw new Error('ACK_REQUIRED');
  if (consent.accelerated_deletion_at) throw new Error('ALREADY_ACCELERATED');

  const { data: employee } = await admin
    .from('employees')
    .select('email')
    .eq('id', employeeId)
    .eq('project_id', projectId)
    .maybeSingle();

  const email = employee?.email?.trim().toLowerCase();
  if (!email?.includes('@')) throw new Error('INVALID_EMAIL');

  return email;
}

async function sendAccelerationOtpEmail(
  email: string,
  code: string,
  linkToken: string
): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME ?? APP_NAME;
  const expiresMinutes = ACCELERATION_OTP_TTL_MINUTES;
  const confirmUrl = buildClosureAccelerationConfirmUrl(linkToken);

  if (!apiKey || !senderEmail) {
    if (process.env.NODE_ENV === 'development') {
      console.info(`[closure-accel-dev] OTP ${email}: ${code}`);
      console.info(`[closure-accel-dev] Link: ${confirmUrl}`);
      return;
    }
    throw new Error('EMAIL_NOT_CONFIGURED');
  }

  const html = `<!DOCTYPE html><html lang="tr"><body style="font-family:system-ui,sans-serif;padding:24px;">
    <p>${strings.codeIntro}</p>
    <p style="font-size:32px;font-weight:800;letter-spacing:8px;">${code}</p>
    <p style="color:#64748b;font-size:13px;">${strings.codeHint}</p>
    <p><a href="${confirmUrl}" style="color:#2563eb;">${strings.confirmButton}</a></p>
    <p style="font-size:12px;color:#94a3b8;">${formatString(strings.validityHtml, { minutes: expiresMinutes })}</p>
  </body></html>`;

  const text = [
    formatString(strings.textTitle, { appName: APP_NAME }),
    formatString(strings.textCode, { code }),
    formatString(strings.textConfirmLink, { url: confirmUrl }),
    formatString(strings.textValidity, { minutes: expiresMinutes }),
    strings.textIgnore,
  ].join('\n');

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email }],
      subject: formatString(strings.subject, { appName: APP_NAME }),
      htmlContent: html,
      textContent: text,
    }),
  });

  if (!res.ok) {
    throw new Error(`EMAIL_SEND_FAILED:${res.status}`);
  }
}

export async function prepareClosureAccelerationOtp(params: {
  projectId: string;
  employeeId: string;
}): Promise<{ maskedEmail: string; expiresInMinutes: number }> {
  if (!isEmailOtpConfigured() && process.env.NODE_ENV !== 'development') {
    throw new Error('EMAIL_NOT_CONFIGURED');
  }

  const email = await assertCanAccelerate(params.projectId, params.employeeId);

  const recent = await countRecentSendsForEmployee(params.employeeId);
  if (recent >= ACCELERATION_HOURLY_SEND_LIMIT) {
    throw new Error('RATE_LIMITED');
  }

  const admin = createAdminClient();
  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);
  const linkToken = generateToken();
  const expiresAt = new Date(Date.now() + ACCELERATION_OTP_TTL_MINUTES * 60_000).toISOString();
  const now = new Date().toISOString();

  const { error } = await admin.from('personnel_closure_acceleration_otp').insert({
    project_id: params.projectId,
    employee_id: params.employeeId,
    email,
    code_hash: codeHash,
    link_token: linkToken,
    expires_at: expiresAt,
    email_sent_at: now,
  });

  if (error) throw new Error(error.message);

  await sendAccelerationOtpEmail(email, code, linkToken);

  await admin.from('project_closure_audit').insert({
    project_id: params.projectId,
    event_type: 'personnel_acceleration_otp_sent',
    actor_role: 'personnel',
    payload: { employeeId: params.employeeId },
  });

  return {
    maskedEmail: maskEmail(email),
    expiresInMinutes: ACCELERATION_OTP_TTL_MINUTES,
  };
}

async function applyAcceleration(params: {
  projectId: string;
  employeeId: string;
  challengeId: string;
}) {
  const admin = createAdminClient();
  const now = new Date();
  const deletionAt = new Date(
    now.getTime() + ACCELERATION_DELETION_MINUTES * 60_000
  ).toISOString();
  const verifiedAt = now.toISOString();

  const { error: consentError } = await admin
    .from('project_closure_consents')
    .update({
      acceleration_verified_at: verifiedAt,
      accelerated_deletion_at: deletionAt,
    })
    .eq('project_id', params.projectId)
    .eq('employee_id', params.employeeId);

  if (consentError) throw new Error(consentError.message);

  await admin
    .from('personnel_closure_acceleration_otp')
    .update({ verified_at: verifiedAt, consumed_at: verifiedAt })
    .eq('id', params.challengeId);

  await admin.from('project_closure_audit').insert({
    project_id: params.projectId,
    event_type: 'personnel_acceleration_verified',
    actor_role: 'personnel',
    payload: {
      employeeId: params.employeeId,
      acceleratedDeletionAt: deletionAt,
    },
  });

  return { acceleratedDeletionAt: deletionAt, deletionMinutes: ACCELERATION_DELETION_MINUTES };
}

async function findOpenChallenge(
  projectId: string,
  employeeId: string
): Promise<ChallengeRow | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('personnel_closure_acceleration_otp')
    .select('*')
    .eq('project_id', projectId)
    .eq('employee_id', employeeId)
    .is('consumed_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as ChallengeRow | null) ?? null;
}

export async function verifyClosureAccelerationOtp(params: {
  projectId: string;
  employeeId: string;
  code: string;
}) {
  await assertCanAccelerate(params.projectId, params.employeeId);

  const challenge = await findOpenChallenge(params.projectId, params.employeeId);
  if (!challenge) throw new Error('CHALLENGE_NOT_FOUND');
  if (new Date(challenge.expires_at).getTime() < Date.now()) {
    throw new Error('CHALLENGE_EXPIRED');
  }
  if (challenge.attempts >= ACCELERATION_MAX_VERIFY_ATTEMPTS) {
    throw new Error('TOO_MANY_ATTEMPTS');
  }

  const admin = createAdminClient();
  const ok = await bcrypt.compare(params.code.trim(), challenge.code_hash);

  if (!ok) {
    await admin
      .from('personnel_closure_acceleration_otp')
      .update({ attempts: challenge.attempts + 1 })
      .eq('id', challenge.id);
    throw new Error('INVALID_CODE');
  }

  return applyAcceleration({
    projectId: params.projectId,
    employeeId: params.employeeId,
    challengeId: challenge.id,
  });
}

export async function confirmClosureAccelerationLink(params: {
  projectId: string;
  employeeId: string;
  linkToken: string;
}) {
  const admin = createAdminClient();
  const { data: challenge } = await admin
    .from('personnel_closure_acceleration_otp')
    .select('*')
    .eq('link_token', params.linkToken)
    .eq('project_id', params.projectId)
    .eq('employee_id', params.employeeId)
    .is('consumed_at', null)
    .maybeSingle();

  if (!challenge) throw new Error('CHALLENGE_NOT_FOUND');
  if (new Date(challenge.expires_at as string).getTime() < Date.now()) {
    throw new Error('CHALLENGE_EXPIRED');
  }

  const { data: consent } = await admin
    .from('project_closure_consents')
    .select('accelerated_deletion_at')
    .eq('project_id', params.projectId)
    .eq('employee_id', params.employeeId)
    .maybeSingle();

  if (consent?.accelerated_deletion_at) {
    return {
      acceleratedDeletionAt: consent.accelerated_deletion_at as string,
      deletionMinutes: ACCELERATION_DELETION_MINUTES,
      alreadyApplied: true,
    };
  }

  await assertCanAccelerate(params.projectId, params.employeeId);

  return {
    ...await applyAcceleration({
      projectId: params.projectId,
      employeeId: params.employeeId,
      challengeId: challenge.id as string,
    }),
    alreadyApplied: false,
  };
}

export function getEffectivePersonnelDeletionDeadline(params: {
  projectDeadlineAt: string | null;
  acceleratedDeletionAt: string | null;
}): string | null {
  if (params.acceleratedDeletionAt) return params.acceleratedDeletionAt;
  return params.projectDeadlineAt;
}
