import { APP_NAME } from '@/lib/brand';
import { buildPersonnelPinResetUrl } from '@/lib/app-url';
import {
  computePhoneLookupHash,
  normalizePhoneDigits,
  validateInternationalPhone,
  validateTcKimlik,
} from '@/lib/field-encryption';
import { findEmployeeForIdentityLogin } from '@/lib/personnel-login';
import { maskEmail } from '@/lib/otp-delivery';
import { validatePersonnelPin } from '@/lib/personnel-pin';
import { buildEmployeePinFields } from '@/lib/personnel-pin-storage';
import { createAdminClient } from '@/utils/supabase/admin';
import { createHash, randomBytes } from 'crypto';

const PIN_RESET_LINK_MINUTES = 30;
const PIN_RESET_EMAIL_COOLDOWN_HOURS = 6;

export { PIN_RESET_LINK_MINUTES, PIN_RESET_EMAIL_COOLDOWN_HOURS };

type EmployeeContact = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  phone_lookup_hash: string | null;
  project_id: string;
  project_name: string | null;
  is_active: boolean;
};

const GENERIC_MISMATCH =
  'Girdiğiniz bilgiler kayıtlarımızla eşleşmedi. Bilgilerinizi kontrol edin veya şantiye yöneticinize başvurun.';

async function loadEmployeeContact(employeeId: string): Promise<EmployeeContact | null> {
  const admin = createAdminClient();
  const { data: emp, error } = await admin
    .from('employees')
    .select('id, name, email, phone, phone_lookup_hash, project_id, is_active')
    .eq('id', employeeId)
    .maybeSingle();

  if (error || !emp?.email) return null;

  let projectName: string | null = null;
  if (emp.project_id) {
    const { data: project } = await admin
      .from('projects')
      .select('name')
      .eq('id', emp.project_id)
      .maybeSingle();
    projectName = (project?.name as string | undefined) ?? null;
  }

  return {
    id: emp.id as string,
    name: emp.name as string,
    email: (emp.email as string).trim().toLowerCase(),
    phone: (emp.phone as string | null) ?? null,
    phone_lookup_hash: (emp.phone_lookup_hash as string | null) ?? null,
    project_id: emp.project_id as string,
    project_name: projectName,
    is_active: emp.is_active !== false,
  };
}

async function findEmployeeContactByTc(tc: string): Promise<EmployeeContact | null> {
  const admin = createAdminClient();
  const loginRow = await findEmployeeForIdentityLogin(admin, 'tc', tc);
  if (!loginRow) return null;
  return loadEmployeeContact(loginRow.id);
}

function phonesMatch(employee: EmployeeContact, inputPhone: string): boolean {
  const inputHash = computePhoneLookupHash(inputPhone);
  if (employee.phone_lookup_hash && inputHash) {
    return employee.phone_lookup_hash === inputHash;
  }

  const stored = employee.phone ? normalizePhoneDigits(employee.phone) : null;
  const input = normalizePhoneDigits(inputPhone);
  return Boolean(stored && input && stored === input);
}

function emailsMatch(storedEmail: string, inputEmail: string): boolean {
  return storedEmail.trim().toLowerCase() === inputEmail.trim().toLowerCase();
}

export function validatePinResetInputs(input: {
  tcKimlik: string;
  phone: string;
  email?: string;
}): string | null {
  const tc = input.tcKimlik.replace(/\D/g, '');
  if (!validateTcKimlik(tc)) return 'Geçerli bir T.C. kimlik numarası girin.';
  if (!input.phone.trim() || !validateInternationalPhone(input.phone)) {
    return 'Geçerli bir telefon numarası girin.';
  }
  if (input.email !== undefined) {
    const email = input.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Geçerli bir e-posta adresi girin.';
    }
  }
  return null;
}

export async function lookupPinResetEmailHint(input: {
  tcKimlik: string;
  phone: string;
}): Promise<{ ok: true; maskedEmail: string } | { ok: false; error: string }> {
  const validationError = validatePinResetInputs(input);
  if (validationError) return { ok: false, error: validationError };

  const tc = input.tcKimlik.replace(/\D/g, '');
  const employee = await findEmployeeContactByTc(tc);

  if (!employee?.is_active || !phonesMatch(employee, input.phone)) {
    return { ok: false, error: GENERIC_MISMATCH };
  }

  return { ok: true, maskedEmail: maskEmail(employee.email) };
}

async function issuePinResetToken(employeeId: string): Promise<string> {
  const admin = createAdminClient();
  const token = createResetToken();
  const tokenHash = hashResetToken(token);
  const expiresAt = new Date(Date.now() + PIN_RESET_LINK_MINUTES * 60 * 1000).toISOString();

  await admin
    .from('personnel_pin_reset_tokens')
    .update({ consumed_at: new Date().toISOString() })
    .eq('employee_id', employeeId)
    .is('consumed_at', null);

  const { error: insertError } = await admin.from('personnel_pin_reset_tokens').insert({
    employee_id: employeeId,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  if (insertError) {
    if (insertError.message.includes('personnel_pin_reset_tokens')) {
      throw new Error('PIN sıfırlama tablosu eksik — 052_personnel_pin_reset_tokens migration çalıştırın');
    }
    throw new Error(insertError.message);
  }

  return token;
}

export async function startPersonnelPinReset(input: {
  tcKimlik: string;
  phone: string;
  email: string;
}): Promise<
  { ok: true; resetToken: string; employeeName: string } | { ok: false; error: string }
> {
  const validationError = validatePinResetInputs(input);
  if (validationError) return { ok: false, error: validationError };

  const employee = await verifyEmployeeIdentity(input);
  if (!employee) {
    return { ok: false, error: GENERIC_MISMATCH };
  }

  const resetToken = await issuePinResetToken(employee.id);
  return { ok: true, resetToken, employeeName: employee.name };
}

function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function createResetToken(): string {
  return randomBytes(32).toString('base64url');
}

async function verifyEmployeeIdentity(input: {
  tcKimlik: string;
  phone: string;
  email: string;
}): Promise<EmployeeContact | null> {
  const validationError = validatePinResetInputs(input);
  if (validationError) return null;

  const tc = input.tcKimlik.replace(/\D/g, '');
  const employee = await findEmployeeContactByTc(tc);
  if (
    !employee?.is_active ||
    !phonesMatch(employee, input.phone) ||
    !emailsMatch(employee.email, input.email)
  ) {
    return null;
  }
  return employee;
}

function formatEmailCooldownMessage(remainingMs: number): string {
  const totalMin = Math.max(1, Math.ceil(remainingMs / 60_000));
  if (totalMin >= 60) {
    const hours = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    if (mins > 0) {
      return `Sıfırlama linki en fazla ${PIN_RESET_EMAIL_COOLDOWN_HOURS} saatte bir gönderilir. ${hours} saat ${mins} dakika sonra tekrar deneyin.`;
    }
    return `Sıfırlama linki en fazla ${PIN_RESET_EMAIL_COOLDOWN_HOURS} saatte bir gönderilir. ${hours} saat sonra tekrar deneyin.`;
  }
  return `Sıfırlama linki en fazla ${PIN_RESET_EMAIL_COOLDOWN_HOURS} saatte bir gönderilir. ${totalMin} dakika sonra tekrar deneyin.`;
}

async function assertPinResetEmailCooldown(
  employeeId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('employees')
    .select('last_pin_reset_email_at')
    .eq('id', employeeId)
    .maybeSingle();

  if (error) {
    if (error.message.includes('last_pin_reset_email_at')) {
      throw new Error('053_pin_reset_email_cooldown.sql migration çalıştırın');
    }
    throw new Error(error.message);
  }

  const lastSent = data?.last_pin_reset_email_at as string | null | undefined;
  if (!lastSent) return { ok: true };

  const cooldownMs = PIN_RESET_EMAIL_COOLDOWN_HOURS * 60 * 60 * 1000;
  const elapsed = Date.now() - new Date(lastSent).getTime();
  if (elapsed >= cooldownMs) return { ok: true };

  return { ok: false, error: formatEmailCooldownMessage(cooldownMs - elapsed) };
}

async function markPinResetEmailSent(employeeId: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from('employees')
    .update({ last_pin_reset_email_at: new Date().toISOString() })
    .eq('id', employeeId);

  if (error) {
    if (error.message.includes('last_pin_reset_email_at')) {
      throw new Error('053_pin_reset_email_cooldown.sql migration çalıştırın');
    }
    throw new Error(error.message);
  }
}

export async function sendPersonnelPinResetLink(input: {
  tcKimlik: string;
  phone: string;
  email: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const validationError = validatePinResetInputs(input);
  if (validationError) return { ok: false, error: validationError };

  const employee = await verifyEmployeeIdentity(input);
  if (!employee) {
    return { ok: false, error: GENERIC_MISMATCH };
  }

  const cooldown = await assertPinResetEmailCooldown(employee.id);
  if (!cooldown.ok) {
    return { ok: false, error: cooldown.error };
  }

  const token = await issuePinResetToken(employee.id);
  await sendPinResetLinkEmail(employee, token);
  await markPinResetEmailSent(employee.id);
  return { ok: true };
}

export async function validatePinResetToken(
  token: string
): Promise<
  | { ok: true; employeeName: string; expiresAt: string; expiresInMinutes: number }
  | { ok: false; error: string }
> {
  const trimmed = token.trim();
  if (!trimmed) return { ok: false, error: 'Geçersiz bağlantı' };

  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from('personnel_pin_reset_tokens')
    .select('employee_id, expires_at, consumed_at')
    .eq('token_hash', hashResetToken(trimmed))
    .maybeSingle();

  if (error || !row) {
    return { ok: false, error: 'Bağlantı geçersiz veya süresi dolmuş.' };
  }
  if (row.consumed_at) {
    return { ok: false, error: 'Bu bağlantı daha önce kullanıldı. Yeni bir sıfırlama linki isteyin.' };
  }
  const expiresAt = row.expires_at as string;
  if (new Date(expiresAt) < new Date()) {
    return {
      ok: false,
      error: `Bağlantının süresi doldu (${PIN_RESET_LINK_MINUTES} dakika). Giriş ekranından yeni link isteyin.`,
    };
  }

  const employee = await loadEmployeeContact(row.employee_id as string);
  if (!employee?.is_active) {
    return { ok: false, error: 'Hesap aktif değil. Yöneticinize başvurun.' };
  }

  return {
    ok: true,
    employeeName: employee.name,
    expiresAt,
    expiresInMinutes: PIN_RESET_LINK_MINUTES,
  };
}

export async function completePersonnelPinReset(input: {
  token: string;
  newPin: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const pinError = validatePersonnelPin(input.newPin);
  if (pinError) return { ok: false, error: pinError };

  const trimmed = input.token.trim();
  if (!trimmed) return { ok: false, error: 'Geçersiz bağlantı' };

  const admin = createAdminClient();
  const tokenHash = hashResetToken(trimmed);
  const nowIso = new Date().toISOString();

  const { data: row, error } = await admin
    .from('personnel_pin_reset_tokens')
    .select('id, employee_id, expires_at, consumed_at')
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (error || !row) {
    return { ok: false, error: 'Bağlantı geçersiz veya süresi dolmuş.' };
  }
  if (row.consumed_at) {
    return { ok: false, error: 'Bu bağlantı daha önce kullanıldı. Yeni bir sıfırlama linki isteyin.' };
  }
  if (new Date(row.expires_at as string) < new Date()) {
    return {
      ok: false,
      error: `Bağlantının süresi doldu (${PIN_RESET_LINK_MINUTES} dakika). Giriş ekranından yeni link isteyin.`,
    };
  }

  const employee = await loadEmployeeContact(row.employee_id as string);
  if (!employee?.is_active) {
    return { ok: false, error: 'Hesap aktif değil. Yöneticinize başvurun.' };
  }

  const pinFields = await buildEmployeePinFields(input.newPin);
  const { error: updateError } = await admin
    .from('employees')
    .update(pinFields)
    .eq('id', employee.id);

  if (updateError) {
    return { ok: false, error: 'PIN güncellenemedi' };
  }

  const { data: consumed, error: consumeError } = await admin
    .from('personnel_pin_reset_tokens')
    .update({ consumed_at: nowIso })
    .eq('id', row.id)
    .is('consumed_at', null)
    .gt('expires_at', nowIso)
    .select('id')
    .maybeSingle();

  if (consumeError || !consumed) {
    return { ok: false, error: 'Bu bağlantı daha önce kullanıldı veya süresi doldu.' };
  }

  return { ok: true };
}

async function sendBrevoEmail(payload: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME ?? APP_NAME;

  if (!apiKey || !senderEmail) {
    if (process.env.NODE_ENV === 'development') {
      console.info(`[pin-reset-dev] → ${payload.to}: ${payload.subject}`);
      console.info(payload.text);
      return;
    }
    throw new Error('PIN sıfırlama e-postası yapılandırılmamış');
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
      to: [{ email: payload.to.trim().toLowerCase() }],
      subject: payload.subject,
      htmlContent: payload.html,
      textContent: payload.text,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`E-posta gönderilemedi (${res.status})${detail ? `: ${detail.slice(0, 120)}` : ''}`);
  }
}

async function sendPinResetLinkEmail(employee: EmployeeContact, token: string): Promise<void> {
  const resetUrl = buildPersonnelPinResetUrl(token);
  const subject = `${APP_NAME} — PIN sıfırlama bağlantınız`;
  const text = [
    `Merhaba ${employee.name},`,
    '',
    'Kimlik bilgileriniz doğrulandı. Yeni PIN belirlemek için aşağıdaki bağlantıyı kullanın:',
    resetUrl,
    '',
    `Bağlantı ${PIN_RESET_LINK_MINUTES} dakika geçerlidir ve yalnızca bir kez kullanılabilir.`,
    'Bu talebi siz yapmadıysanız bu e-postayı yok sayın ve yöneticinize bildirin.',
  ].join('\n');

  const html = `<!DOCTYPE html><html lang="tr"><body style="font-family:system-ui,sans-serif;color:#334155;line-height:1.6;">
<p>Merhaba <strong>${employee.name}</strong>,</p>
<p>Kimlik bilgileriniz doğrulandı. Yeni PIN belirlemek için aşağıdaki düğmeye tıklayın:</p>
<p style="margin:24px 0;text-align:center;">
  <a href="${resetUrl}" style="display:inline-block;padding:14px 28px;background:#2563eb;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;border-radius:12px;">Yeni PIN belirle</a>
</p>
<p style="font-size:13px;color:#64748b;">Bağlantı ${PIN_RESET_LINK_MINUTES} dakika geçerlidir ve yalnızca bir kez kullanılabilir.</p>
<p style="font-size:13px;color:#64748b;">Bu talebi siz yapmadıysanız bu e-postayı yok sayın.</p>
</body></html>`;

  await sendBrevoEmail({
    to: employee.email,
    subject,
    html,
    text,
  });
}
