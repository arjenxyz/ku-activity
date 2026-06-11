import bcrypt from 'bcryptjs';
import { createAdminClient } from '@/utils/supabase/admin';
import {
  decryptField,
  encryptField,
  maskIban,
  maskTcKimlik,
  normalizeIban,
  validateTcKimlik,
  validateTurkishIban,
} from '@/lib/field-encryption';
import { formatFullName } from '@/lib/format';
import {
  buildAdminApprovalUrl,
  generateVerificationCode,
  normalizeVerificationCode,
} from '@/lib/registration-codes';
import {
  publicPhotoUrl,
  transferRegistrationPhotoToEmployee,
  uploadRegistrationPhoto,
} from '@/lib/registration-photo';

export type RegistrationApplyInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  tcKimlik: string;
  birthDate: string;
  iban: string;
};

function assertEncryptionReady() {
  if (!process.env.FIELD_ENCRYPTION_KEY) {
    throw new Error('FIELD_ENCRYPTION_KEY yapılandırılmamış');
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY yapılandırılmamış');
  }
}

export async function submitRegistrationApplication(input: RegistrationApplyInput) {
  assertEncryptionReady();

  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone?.trim() || null;
  const tc = input.tcKimlik.replace(/\D/g, '');
  const birthDate = input.birthDate;
  const iban = normalizeIban(input.iban);

  if (!firstName || !lastName || !email) {
    throw new Error('Ad, soyad ve e-posta zorunludur');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Geçerli bir e-posta girin');
  }
  if (!validateTcKimlik(tc)) {
    throw new Error('Geçersiz T.C. kimlik numarası');
  }
  if (!birthDate) {
    throw new Error('Doğum tarihi zorunludur');
  }
  if (!validateTurkishIban(iban)) {
    throw new Error('Geçersiz IBAN (TR ile 26 karakter)');
  }

  const admin = createAdminClient();

  const { data: existingEmployee } = await admin
    .from('employees')
    .select('id')
    .ilike('email', email)
    .maybeSingle();

  if (existingEmployee) {
    throw new Error('Bu e-posta ile kayıtlı personel zaten var');
  }

  const { data: pending } = await admin
    .from('employee_registration_requests')
    .select('id, verification_code')
    .ilike('email', email)
    .eq('status', 'pending')
    .maybeSingle();

  if (pending) {
    return {
      id: pending.id,
      verificationCode: pending.verification_code,
      approvalUrl: buildAdminApprovalUrl(pending.verification_code),
      reused: true,
    };
  }

  let verificationCode = generateVerificationCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await admin
      .from('employee_registration_requests')
      .insert({
        verification_code: verificationCode,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        tc_kimlik_enc: encryptField(tc),
        birth_date_enc: encryptField(birthDate),
        iban_enc: encryptField(iban),
      })
      .select('id, verification_code')
      .single();

    if (!error && data) {
      return {
        id: data.id,
        verificationCode: data.verification_code,
        approvalUrl: buildAdminApprovalUrl(data.verification_code),
        reused: false,
      };
    }
    if (error?.code === '23505') {
      verificationCode = generateVerificationCode();
      continue;
    }
    throw new Error(error?.message || 'Başvuru kaydedilemedi');
  }

  throw new Error('Başvuru kodu oluşturulamadı, tekrar deneyin');
}

export async function attachRegistrationPhoto(requestId: string, file: File) {
  return uploadRegistrationPhoto(requestId, file);
}

export async function getPublicRegistrationStatus(code: string) {
  const normalized = normalizeVerificationCode(code);
  const admin = createAdminClient();
  const { data } = await admin
    .from('employee_registration_requests')
    .select('status, first_name, last_name, created_at, expires_at')
    .eq('verification_code', normalized)
    .maybeSingle();

  if (!data) return null;

  return {
    status: data.status,
    name: formatFullName(data.first_name, data.last_name),
    createdAt: data.created_at,
    expiresAt: data.expires_at,
  };
}

export async function getRegistrationForAdmin(code: string) {
  assertEncryptionReady();
  const normalized = normalizeVerificationCode(code);
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('employee_registration_requests')
    .select('*')
    .eq('verification_code', normalized)
    .maybeSingle();

  if (error || !data) return null;

  const tc = decryptField(data.tc_kimlik_enc);
  const birthDate = decryptField(data.birth_date_enc);
  const iban = decryptField(data.iban_enc);

  return {
    id: data.id,
    verificationCode: data.verification_code,
    status: data.status,
    firstName: data.first_name,
    lastName: data.last_name,
    email: data.email,
    phone: data.phone,
    projectId: data.project_id,
    employeeId: data.employee_id,
    expiresAt: data.expires_at,
    createdAt: data.created_at,
    rejectedReason: data.rejected_reason,
    photoUrl: data.photo_path ? publicPhotoUrl(data.photo_path) : null,
    sensitive: {
      tcKimlik: tc,
      tcKimlikMasked: maskTcKimlik(tc),
      birthDate,
      iban,
      ibanMasked: maskIban(iban),
    },
  };
}

export async function listPendingRegistrations() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('employee_registration_requests')
    .select('id, verification_code, first_name, last_name, email, phone, status, created_at, expires_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export type ApproveRegistrationInput = {
  registrationId: string;
  projectId: string;
  dailyWage: number;
  position: string;
  pin: string;
  hireDate?: string;
  approvedBy: string;
};

export async function approveRegistration(input: ApproveRegistrationInput) {
  assertEncryptionReady();

  if (input.pin.length < 4 || input.pin.length > 12) {
    throw new Error('PIN 4-12 karakter olmalı');
  }

  const admin = createAdminClient();
  const { data: req, error: reqError } = await admin
    .from('employee_registration_requests')
    .select('*')
    .eq('id', input.registrationId)
    .eq('status', 'pending')
    .maybeSingle();

  if (reqError || !req) {
    throw new Error('Bekleyen başvuru bulunamadı');
  }

  if (new Date(req.expires_at) < new Date()) {
    await admin
      .from('employee_registration_requests')
      .update({ status: 'expired' })
      .eq('id', req.id);
    throw new Error('Başvuru süresi dolmuş');
  }

  const pinHash = await bcrypt.hash(input.pin, 12);
  const fullName = formatFullName(req.first_name, req.last_name);

  const { data: employee, error: empError } = await admin
    .from('employees')
    .insert({
      project_id: input.projectId,
      name: fullName,
      email: req.email,
      phone: req.phone,
      daily_wage: input.dailyWage,
      position: input.position,
      hire_date: input.hireDate || null,
      pin_hash: pinHash,
    })
    .select('id')
    .single();

  if (empError || !employee) {
    throw new Error(empError?.message || 'Personel oluşturulamadı');
  }

  const { error: sensError } = await admin.from('employee_sensitive_data').insert({
    employee_id: employee.id,
    tc_kimlik_enc: req.tc_kimlik_enc,
    birth_date_enc: req.birth_date_enc,
    iban_enc: req.iban_enc,
  });

  if (sensError) {
    await admin.from('employees').delete().eq('id', employee.id);
    throw new Error('Hassas veriler kaydedilemedi');
  }

  await transferRegistrationPhotoToEmployee(req.photo_path ?? null, input.projectId, employee.id);

  const { error: updError } = await admin
    .from('employee_registration_requests')
    .update({
      status: 'approved',
      project_id: input.projectId,
      employee_id: employee.id,
      approved_by: input.approvedBy,
    })
    .eq('id', req.id);

  if (updError) {
    throw new Error('Başvuru durumu güncellenemedi');
  }

  return { employeeId: employee.id, email: req.email };
}

export async function rejectRegistration(id: string, reason?: string) {
  const admin = createAdminClient();
  const { error } = await admin
    .from('employee_registration_requests')
    .update({
      status: 'rejected',
      rejected_reason: reason?.trim() || null,
    })
    .eq('id', id)
    .eq('status', 'pending');

  if (error) throw new Error(error.message);
}
