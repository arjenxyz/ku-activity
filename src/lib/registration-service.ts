import { buildEmployeePinFields } from '@/lib/personnel-pin-storage';
import { createAdminClient } from '@/utils/supabase/admin';
import {
  decryptField,
  encryptField,
  type IdentityType,
  normalizeIdentityNumber,
  maskIban,
  maskTcKimlik,
  normalizeIban,
  validateIdentityNumber,
  validateTurkishIban,
  toStoredPhone,
  validateInternationalPhone,
} from '@/lib/field-encryption';
import {
  assertIdentityUnique,
  findPendingRegistrationIdForResubmit,
  mapIdentityUniqueViolation,
} from '@/lib/identity-uniqueness';
import { validatePersonnelPin } from '@/lib/personnel-pin';
import {
  constructionAgeErrorMessage,
  isConstructionEligibleBirthDate,
} from '@/lib/age-validation';
import { formatFullName } from '@/lib/format';
import {
  buildAdminApprovalUrl,
  generateVerificationCode,
  normalizeVerificationCode,
} from '@/lib/registration-codes';
import { assertAdminOwnsProject } from '@/lib/project-access';
import { signedRegistrationPhotoUrl } from '@/lib/photo-storage';
import {
  deleteRegistrationPhoto,
  transferRegistrationPhotoToEmployee,
  uploadRegistrationPhoto,
} from '@/lib/registration-photo';

export type RegistrationApplyInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  identityType: IdentityType;
  identityNumber: string;
  tcKimlik: string;
  birthDate: string;
  iban: string;
  pin: string;
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
  const phoneRaw = input.phone?.trim() ?? '';
  const identityType = (input.identityType ?? 'tc') as IdentityType;
  const identityNumber = normalizeIdentityNumber(identityType, input.identityNumber || input.tcKimlik || '');
  const birthDate = input.birthDate;
  const iban = normalizeIban(input.iban);

  if (!firstName || !lastName || !email) {
    throw new Error('Ad, soyad ve e-posta zorunludur');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Geçerli bir e-posta girin');
  }
  if (!validateIdentityNumber(identityType, identityNumber)) {
    throw new Error(
      identityType === 'tc'
        ? 'Geçersiz T.C. kimlik numarası'
        : 'Geçersiz yabancı kimlik / pasaport numarası'
    );
  }
  if (!birthDate) {
    throw new Error('Doğum tarihi zorunludur');
  }
  if (!isConstructionEligibleBirthDate(birthDate)) {
    throw new Error(constructionAgeErrorMessage());
  }
  if (!validateTurkishIban(iban)) {
    throw new Error(
      'Geçerli bir IBAN girin (TR ile 26 karakter, kontrol hanesi doğru olmalı).'
    );
  }
  if (!phoneRaw) {
    throw new Error('Telefon numarası zorunludur');
  }
  if (!validateInternationalPhone(phoneRaw)) {
    throw new Error('Geçersiz telefon numarası');
  }
  const phone = toStoredPhone(phoneRaw);
  const pinError = validatePersonnelPin(input.pin);
  if (pinError) {
    throw new Error(pinError);
  }

  const pinFields = await buildEmployeePinFields(input.pin);
  const admin = createAdminClient();

  const existingPendingId = await findPendingRegistrationIdForResubmit(admin, {
    email,
    identityType,
    identityNumber,
  });

  if (existingPendingId) {
    const { data: pending } = await admin
      .from('employee_registration_requests')
      .select('id, verification_code')
      .eq('id', existingPendingId)
      .maybeSingle();

    if (pending) {
      const hashes = await assertIdentityUnique(admin, {
        email,
        phone,
        identityType,
        identityNumber,
        tcKimlik: identityType === 'tc' ? identityNumber : '',
        iban,
        excludeRegistrationId: pending.id,
      });

      await admin
        .from('employee_registration_requests')
        .update({
          pin_hash: pinFields.pin_hash,
          pin_encrypted: pinFields.pin_encrypted,
          identity_type: identityType,
          identity_number_enc: encryptField(identityNumber),
          identity_lookup_hash: hashes.identityLookupHash,
          tc_lookup_hash: hashes.tcLookupHash,
          phone_lookup_hash: hashes.phoneLookupHash,
          iban_lookup_hash: hashes.ibanLookupHash,
          first_name: firstName,
          last_name: lastName,
          phone,
          tc_kimlik_enc: identityType === 'tc' ? encryptField(identityNumber) : null,
          birth_date_enc: encryptField(birthDate),
          iban_enc: encryptField(iban),
        })
        .eq('id', pending.id);

      return {
        id: pending.id,
        verificationCode: pending.verification_code,
        approvalUrl: buildAdminApprovalUrl(pending.verification_code),
        reused: true,
      };
    }
  }

  const hashes = await assertIdentityUnique(admin, {
    email,
    phone,
    identityType,
    identityNumber,
    tcKimlik: identityType === 'tc' ? identityNumber : '',
    iban,
  });

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
        tc_kimlik_enc: identityType === 'tc' ? encryptField(identityNumber) : null,
        birth_date_enc: encryptField(birthDate),
        iban_enc: encryptField(iban),
        identity_type: identityType,
        identity_number_enc: encryptField(identityNumber),
        identity_lookup_hash: hashes.identityLookupHash,
        pin_hash: pinFields.pin_hash,
        pin_encrypted: pinFields.pin_encrypted,
        tc_lookup_hash: hashes.tcLookupHash,
        phone_lookup_hash: hashes.phoneLookupHash,
        iban_lookup_hash: hashes.ibanLookupHash,
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
      const mapped = mapIdentityUniqueViolation(error.message ?? '');
      if (mapped) throw new Error(mapped);
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
    .select('status, first_name, last_name, email, created_at, expires_at, employee_id')
    .eq('verification_code', normalized)
    .maybeSingle();

  if (!data) return null;

  let position: string | null = null;
  if (data.status === 'approved' && data.employee_id) {
    const { data: emp } = await admin
      .from('employees')
      .select('position, is_active')
      .eq('id', data.employee_id)
      .maybeSingle();
    position = emp?.position ?? null;
  }

  return {
    status: data.status,
    name: formatFullName(data.first_name, data.last_name),
    email: data.email,
    position,
    active: data.status === 'approved',
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

  const identityType = (data.identity_type as IdentityType | null) ?? 'tc';
  const identityPlain = data.identity_number_enc
    ? decryptField(data.identity_number_enc)
    : data.tc_kimlik_enc
      ? decryptField(data.tc_kimlik_enc)
      : '';
  const tc = identityType === 'tc' ? identityPlain : '';
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
    photoUrl: data.photo_path ? await signedRegistrationPhotoUrl(data.photo_path) : null,
    sensitive: {
      identityType,
      identityNumber: identityPlain,
      tcKimlik: tc,
      tcKimlikMasked: tc ? maskTcKimlik(tc) : identityPlain,
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
  hireDate: string;
  approvedBy: string;
};

export async function approveRegistration(input: ApproveRegistrationInput) {
  assertEncryptionReady();

  const projectId = input.projectId?.trim();
  const position = input.position?.trim();
  const hireDate = input.hireDate?.trim();

  if (!projectId) {
    throw new Error('Proje seçimi zorunludur');
  }
  if (!position) {
    throw new Error('Pozisyon zorunludur');
  }
  if (!Number.isFinite(input.dailyWage) || input.dailyWage <= 0) {
    throw new Error('Geçerli bir günlük yevmiye girin');
  }
  if (!hireDate) {
    throw new Error('İşe giriş tarihi zorunludur');
  }

  const admin = createAdminClient();

  await assertAdminOwnsProject(admin, projectId, input.approvedBy);

  const { data: project } = await admin
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .maybeSingle();
  if (!project) {
    throw new Error('Seçilen proje bulunamadı');
  }
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

  const birthDate = decryptField(req.birth_date_enc);
  if (!isConstructionEligibleBirthDate(birthDate)) {
    throw new Error(constructionAgeErrorMessage());
  }

  const pinHash = req.pin_hash as string | null;
  const pinEncrypted = (req.pin_encrypted as string | null) ?? null;
  if (!pinHash) {
    throw new Error('Başvuruda giriş şifresi (PIN) tanımlı değil. Personelin başvuruyu yenilemesi gerekir.');
  }

  const identityType = ((req.identity_type as IdentityType | null) ?? 'tc') as IdentityType;
  const identityPlain = req.identity_number_enc
    ? decryptField(req.identity_number_enc)
    : req.tc_kimlik_enc
      ? decryptField(req.tc_kimlik_enc)
      : '';
  const tcPlain = identityType === 'tc' ? identityPlain : '';
  const ibanPlain = decryptField(req.iban_enc);

  const hashes = await assertIdentityUnique(admin, {
    email: req.email,
    phone: req.phone,
    identityType,
    identityNumber: identityPlain,
    tcKimlik: tcPlain,
    iban: ibanPlain,
    excludeRegistrationId: req.id,
  });

  const fullName = formatFullName(req.first_name, req.last_name);

  const { data: employee, error: empError } = await admin
    .from('employees')
    .insert({
      project_id: projectId,
      name: fullName,
      email: req.email,
      phone: req.phone,
      phone_lookup_hash: hashes.phoneLookupHash,
      daily_wage: input.dailyWage,
      position,
      hire_date: hireDate,
      pin_hash: pinHash,
      pin_encrypted: pinEncrypted,
      is_active: true,
    })
    .select('id')
    .single();

  if (empError || !employee) {
    const mapped = mapIdentityUniqueViolation(empError?.message ?? '');
    throw new Error(mapped ?? empError?.message ?? 'Personel oluşturulamadı');
  }

  const { error: sensError } = await admin.from('employee_sensitive_data').insert({
    employee_id: employee.id,
    tc_kimlik_enc: req.tc_kimlik_enc,
    birth_date_enc: req.birth_date_enc,
    iban_enc: req.iban_enc,
    identity_type: identityType,
    identity_number_enc: req.identity_number_enc ?? req.tc_kimlik_enc,
    identity_lookup_hash: hashes.identityLookupHash,
    tc_lookup_hash: hashes.tcLookupHash,
    iban_lookup_hash: hashes.ibanLookupHash,
  });

  if (sensError) {
    await admin.from('employees').delete().eq('id', employee.id);
    const mapped = mapIdentityUniqueViolation(sensError.message ?? '');
    throw new Error(mapped ?? 'Hassas veriler kaydedilemedi');
  }

  await transferRegistrationPhotoToEmployee(req.photo_path ?? null, projectId, employee.id);

  const { error: updError } = await admin
    .from('employee_registration_requests')
    .update({
      status: 'approved',
      project_id: projectId,
      employee_id: employee.id,
      approved_by: input.approvedBy,
    })
    .eq('id', req.id);

  if (updError) {
    throw new Error('Başvuru durumu güncellenemedi');
  }

  const { linkContractAcceptancesToEmployee } = await import('@/lib/contract-service');
  await linkContractAcceptancesToEmployee(req.id, employee.id);

  return { employeeId: employee.id, email: req.email };
}

/** Bekleyen başvuruyu ve ilişkili verileri kalıcı olarak siler (red) */
export async function rejectRegistration(id: string) {
  const admin = createAdminClient();

  const { data: req, error: loadError } = await admin
    .from('employee_registration_requests')
    .select('id, photo_path, status')
    .eq('id', id)
    .maybeSingle();

  if (loadError) throw new Error(loadError.message);
  if (!req) throw new Error('Başvuru bulunamadı');
  if (req.status !== 'pending') {
    throw new Error('Yalnızca bekleyen başvurular reddedilebilir');
  }

  await admin
    .from('personnel_contract_acceptances')
    .delete()
    .eq('registration_request_id', id);

  await deleteRegistrationPhoto(req.photo_path ?? null);

  const { error: deleteError } = await admin
    .from('employee_registration_requests')
    .delete()
    .eq('id', id)
    .eq('status', 'pending');

  if (deleteError) throw new Error(deleteError.message);
}
