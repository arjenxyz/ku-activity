import { APP_NAME, DEFAULT_SUPPORT_EMAIL } from '@/lib/brand';
import {
  computePhoneLookupHash,
  normalizePhoneDigits,
  validateInternationalPhone,
  validateTcKimlik,
} from '@/lib/field-encryption';
import { findEmployeeForIdentityLogin } from '@/lib/personnel-login';
import { maskEmail } from '@/lib/otp-delivery';
import { createAdminClient } from '@/utils/supabase/admin';

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

export async function submitPersonnelPinResetRequest(input: {
  tcKimlik: string;
  phone: string;
  email: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const validationError = validatePinResetInputs(input);
  if (validationError) return { ok: false, error: validationError };

  const tc = input.tcKimlik.replace(/\D/g, '');
  const employee = await findEmployeeContactByTc(tc);

  if (
    !employee?.is_active ||
    !phonesMatch(employee, input.phone) ||
    !emailsMatch(employee.email, input.email)
  ) {
    return { ok: false, error: GENERIC_MISMATCH };
  }

  await sendPinResetEmails(employee);
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

async function sendPinResetEmails(employee: EmployeeContact): Promise<void> {
  const notifyEmail =
    process.env.PIN_RESET_NOTIFY_EMAIL?.trim() ||
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() ||
    DEFAULT_SUPPORT_EMAIL;

  const employeeSubject = `${APP_NAME} — PIN sıfırlama talebiniz alındı`;
  const employeeText = [
    `Merhaba ${employee.name},`,
    '',
    'Kimlik bilgileriniz doğrulandı. PIN sıfırlama talebiniz alındı.',
    'Şantiye yöneticiniz veya sistem yöneticiniz kayıtlı PIN\'inizi sıfırlayacaktır.',
    'Yeni PIN\'iniz size güvenli bir kanaldan iletilecektir.',
    '',
    'Bu talebi siz yapmadıysanız derhal yöneticinize bildirin.',
  ].join('\n');

  const employeeHtml = `<!DOCTYPE html><html lang="tr"><body style="font-family:system-ui,sans-serif;color:#334155;line-height:1.6;">
<p>Merhaba <strong>${employee.name}</strong>,</p>
<p>Kimlik bilgileriniz doğrulandı. PIN sıfırlama talebiniz alındı.</p>
<p>Şantiye yöneticiniz veya sistem yöneticiniz kayıtlı PIN'inizi sıfırlayacaktır. Yeni PIN'iniz size güvenli bir kanaldan iletilecektir.</p>
<p style="color:#64748b;font-size:13px;">Bu talebi siz yapmadıysanız derhal yöneticinize bildirin.</p>
</body></html>`;

  const adminSubject = `${APP_NAME} — Doğrulanmış PIN sıfırlama talebi`;
  const adminText = [
    'Kimlik doğrulaması geçen PIN sıfırlama talebi:',
    '',
    `Personel: ${employee.name}`,
    `Proje: ${employee.project_name ?? employee.project_id}`,
    `E-posta: ${employee.email}`,
    `Telefon: ${employee.phone ?? '-'}`,
    '',
    'Admin panelinden personel şifreleri ekranından yeni PIN atayın.',
  ].join('\n');

  const adminHtml = `<!DOCTYPE html><html lang="tr"><body style="font-family:system-ui,sans-serif;color:#334155;line-height:1.6;">
<p><strong>Kimlik doğrulaması geçen PIN sıfırlama talebi</strong></p>
<ul>
<li>Personel: ${employee.name}</li>
<li>Proje: ${employee.project_name ?? employee.project_id}</li>
<li>E-posta: ${employee.email}</li>
<li>Telefon: ${employee.phone ?? '-'}</li>
</ul>
<p>Admin panelinden personel şifreleri ekranından yeni PIN atayın.</p>
</body></html>`;

  await sendBrevoEmail({
    to: employee.email,
    subject: employeeSubject,
    html: employeeHtml,
    text: employeeText,
  });

  await sendBrevoEmail({
    to: notifyEmail,
    subject: adminSubject,
    html: adminHtml,
    text: adminText,
  });
}
