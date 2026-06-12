import type { SupabaseClient } from '@supabase/supabase-js';
import {
  computePhoneLookupHash,
  hashIbanLookup,
  hashTcKimlik,
  normalizeIban,
  PLACEHOLDER_IBAN,
  validateTurkishIban,
  validateTurkishMobilePhone,
} from '@/lib/field-encryption';

export type IdentityInput = {
  email: string;
  phone?: string | null;
  tcKimlik: string;
  iban: string;
  excludeEmployeeId?: string;
  excludeRegistrationId?: string;
};

export type IdentityHashes = {
  tcLookupHash: string;
  phoneLookupHash: string | null;
  ibanLookupHash: string | null;
};

export function buildIdentityHashes(input: IdentityInput): IdentityHashes {
  const phone = input.phone?.trim() || null;
  if (phone && !validateTurkishMobilePhone(phone)) {
    throw new Error('Geçersiz telefon numarası');
  }

  const normalizedIban = normalizeIban(input.iban);
  if (!normalizedIban || normalizedIban === PLACEHOLDER_IBAN) {
    throw new Error('IBAN zorunludur');
  }
  if (!validateTurkishIban(normalizedIban)) {
    throw new Error(
      'Geçerli bir IBAN girin (TR ile 26 karakter, kontrol hanesi doğru olmalı).'
    );
  }
  const ibanLookupHash = hashIbanLookup(normalizedIban);

  return {
    tcLookupHash: hashTcKimlik(input.tcKimlik.replace(/\D/g, '')),
    phoneLookupHash: phone ? computePhoneLookupHash(phone) : null,
    ibanLookupHash,
  };
}

async function employeeHasHash(
  admin: SupabaseClient,
  column: 'phone_lookup_hash',
  hash: string,
  excludeEmployeeId?: string
): Promise<boolean> {
  let query = admin.from('employees').select('id').eq(column, hash);
  if (excludeEmployeeId) {
    query = query.neq('id', excludeEmployeeId);
  }
  const { data } = await query.maybeSingle();
  return Boolean(data);
}

async function sensitiveHasHash(
  admin: SupabaseClient,
  column: 'tc_lookup_hash' | 'iban_lookup_hash',
  hash: string,
  excludeEmployeeId?: string
): Promise<boolean> {
  let query = admin.from('employee_sensitive_data').select('employee_id').eq(column, hash);
  if (excludeEmployeeId) {
    query = query.neq('employee_id', excludeEmployeeId);
  }
  const { data } = await query.maybeSingle();
  return Boolean(data);
}

async function pendingHasHash(
  admin: SupabaseClient,
  column: 'tc_lookup_hash' | 'phone_lookup_hash' | 'iban_lookup_hash',
  hash: string,
  excludeRegistrationId?: string
): Promise<boolean> {
  let query = admin
    .from('employee_registration_requests')
    .select('id')
    .eq(column, hash)
    .eq('status', 'pending');
  if (excludeRegistrationId) {
    query = query.neq('id', excludeRegistrationId);
  }
  const { data } = await query.maybeSingle();
  return Boolean(data);
}

/** E-posta, telefon, T.C. ve IBAN başka personel/başvuruda kullanılamaz */
export async function assertIdentityUnique(
  admin: SupabaseClient,
  input: IdentityInput
): Promise<IdentityHashes> {
  const email = input.email.trim().toLowerCase();
  const hashes = buildIdentityHashes(input);

  let emailQuery = admin.from('employees').select('id').ilike('email', email);
  if (input.excludeEmployeeId) {
    emailQuery = emailQuery.neq('id', input.excludeEmployeeId);
  }
  const { data: existingEmail } = await emailQuery.maybeSingle();
  if (existingEmail) {
    throw new Error('Bu e-posta ile kayıtlı personel zaten var');
  }

  let pendingEmailQuery = admin
    .from('employee_registration_requests')
    .select('id')
    .ilike('email', email)
    .eq('status', 'pending');
  if (input.excludeRegistrationId) {
    pendingEmailQuery = pendingEmailQuery.neq('id', input.excludeRegistrationId);
  }
  const { data: pendingEmail } = await pendingEmailQuery.maybeSingle();
  if (pendingEmail) {
    throw new Error('Bu e-posta ile bekleyen başvuru zaten var');
  }

  if (
    await sensitiveHasHash(admin, 'tc_lookup_hash', hashes.tcLookupHash, input.excludeEmployeeId)
  ) {
    throw new Error('Bu T.C. kimlik numarası ile kayıtlı personel zaten var');
  }
  if (await pendingHasHash(admin, 'tc_lookup_hash', hashes.tcLookupHash, input.excludeRegistrationId)) {
    throw new Error('Bu T.C. kimlik numarası ile bekleyen başvuru zaten var');
  }

  if (hashes.phoneLookupHash) {
    if (await employeeHasHash(admin, 'phone_lookup_hash', hashes.phoneLookupHash, input.excludeEmployeeId)) {
      throw new Error('Bu telefon numarası ile kayıtlı personel zaten var');
    }
    if (
      await pendingHasHash(admin, 'phone_lookup_hash', hashes.phoneLookupHash, input.excludeRegistrationId)
    ) {
      throw new Error('Bu telefon numarası ile bekleyen başvuru zaten var');
    }
  }

  if (hashes.ibanLookupHash) {
    if (
      await sensitiveHasHash(admin, 'iban_lookup_hash', hashes.ibanLookupHash, input.excludeEmployeeId)
    ) {
      throw new Error('Bu IBAN ile kayıtlı personel zaten var');
    }
    if (
      await pendingHasHash(admin, 'iban_lookup_hash', hashes.ibanLookupHash, input.excludeRegistrationId)
    ) {
      throw new Error('Bu IBAN ile bekleyen başvuru zaten var');
    }
  }

  return hashes;
}

export async function assertEmployeeContactUnique(
  admin: SupabaseClient,
  input: {
    email?: string;
    phone?: string | null;
    excludeEmployeeId: string;
  }
): Promise<{ email?: string; phoneLookupHash?: string | null }> {
  const result: { email?: string; phoneLookupHash?: string | null } = {};

  if (input.email !== undefined) {
    const email = input.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Geçerli bir e-posta girin');
    }
    const { data: existingEmail } = await admin
      .from('employees')
      .select('id')
      .ilike('email', email)
      .neq('id', input.excludeEmployeeId)
      .maybeSingle();
    if (existingEmail) {
      throw new Error('Bu e-posta ile kayıtlı personel zaten var');
    }

    const { data: pendingEmail } = await admin
      .from('employee_registration_requests')
      .select('id')
      .ilike('email', email)
      .eq('status', 'pending')
      .maybeSingle();
    if (pendingEmail) {
      throw new Error('Bu e-posta ile bekleyen başvuru zaten var');
    }
    result.email = email;
  }

  if (input.phone !== undefined) {
    const phone = input.phone?.trim() || null;
    if (phone && !validateTurkishMobilePhone(phone)) {
      throw new Error('Geçersiz telefon numarası');
    }
    const phoneLookupHash = phone ? computePhoneLookupHash(phone) : null;
    if (phoneLookupHash) {
      const { data: existingPhone } = await admin
        .from('employees')
        .select('id')
        .eq('phone_lookup_hash', phoneLookupHash)
        .neq('id', input.excludeEmployeeId)
        .maybeSingle();
      if (existingPhone) {
        throw new Error('Bu telefon numarası ile kayıtlı personel zaten var');
      }

      const { data: pendingPhone } = await admin
        .from('employee_registration_requests')
        .select('id')
        .eq('phone_lookup_hash', phoneLookupHash)
        .eq('status', 'pending')
        .maybeSingle();
      if (pendingPhone) {
        throw new Error('Bu telefon numarası ile bekleyen başvuru zaten var');
      }
    }
    result.phoneLookupHash = phoneLookupHash;
  }

  return result;
}

export function mapIdentityUniqueViolation(message: string): string | null {
  const lower = message.toLowerCase();
  if (lower.includes('employees_email_unique')) {
    return 'Bu e-posta ile kayıtlı personel zaten var';
  }
  if (lower.includes('employees_phone_lookup_hash')) {
    return 'Bu telefon numarası ile kayıtlı personel zaten var';
  }
  if (lower.includes('employee_sensitive_data_tc_lookup_hash')) {
    return 'Bu T.C. kimlik numarası ile kayıtlı personel zaten var';
  }
  if (lower.includes('employee_sensitive_data_iban_lookup_hash')) {
    return 'Bu IBAN ile kayıtlı personel zaten var';
  }
  if (lower.includes('employee_registration_requests_email_pending')) {
    return 'Bu e-posta ile bekleyen başvuru zaten var';
  }
  if (lower.includes('employee_registration_requests_tc_pending')) {
    return 'Bu T.C. kimlik numarası ile bekleyen başvuru zaten var';
  }
  if (lower.includes('employee_registration_requests_phone_pending')) {
    return 'Bu telefon numarası ile bekleyen başvuru zaten var';
  }
  if (lower.includes('employee_registration_requests_iban_pending')) {
    return 'Bu IBAN ile bekleyen başvuru zaten var';
  }
  return null;
}
