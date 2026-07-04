import type { SupabaseClient } from '@supabase/supabase-js';
import {
  computePhoneLookupHash,
  hashIdentityLookup,
  hashIbanLookup,
  type IdentityType,
  normalizeIban,
  PLACEHOLDER_IBAN,
  validateTurkishIban,
  validateInternationalPhone,
} from '@/lib/field-encryption';
import strings from '@json/src/lib/identity-uniqueness.json';

export type IdentityInput = {
  email: string;
  phone?: string | null;
  identityType: IdentityType;
  identityNumber: string;
  tcKimlik?: string;
  iban: string;
  excludeEmployeeId?: string;
  excludeRegistrationId?: string;
};

export type IdentityHashes = {
  identityLookupHash: string;
  tcLookupHash: string | null;
  phoneLookupHash: string | null;
  ibanLookupHash: string | null;
};

export function buildIdentityHashes(input: IdentityInput): IdentityHashes {
  const phone = input.phone?.trim() || null;
  if (phone && !validateInternationalPhone(phone)) {
    throw new Error(strings.invalidPhone);
  }

  const normalizedIban = normalizeIban(input.iban);
  if (!normalizedIban || normalizedIban === PLACEHOLDER_IBAN) {
    throw new Error(strings.ibanRequired);
  }
  if (!validateTurkishIban(normalizedIban)) {
    throw new Error(strings.invalidIban);
  }
  const ibanLookupHash = hashIbanLookup(normalizedIban);

  return {
    identityLookupHash: hashIdentityLookup(input.identityType, input.identityNumber),
    tcLookupHash: input.identityType === 'tc' ? hashIdentityLookup('tc', input.identityNumber) : null,
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
  column: 'identity_lookup_hash' | 'tc_lookup_hash' | 'iban_lookup_hash',
  hash: string,
  excludeEmployeeId?: string,
  identityType?: IdentityType
): Promise<boolean> {
  let query = admin.from('employee_sensitive_data').select('employee_id').eq(column, hash);
  if (identityType && column === 'identity_lookup_hash') {
    query = query.eq('identity_type', identityType);
  }
  if (excludeEmployeeId) {
    query = query.neq('employee_id', excludeEmployeeId);
  }
  const { data } = await query.maybeSingle();
  return Boolean(data);
}

/** Aynı e-posta veya T.C. ile bekleyen başvuru — yeniden gönderimde güncellenir */
export async function findPendingRegistrationIdForResubmit(
  admin: SupabaseClient,
  input: { email: string; identityType: IdentityType; identityNumber: string }
): Promise<string | null> {
  const email = input.email.trim().toLowerCase();
  const identityHash = hashIdentityLookup(input.identityType, input.identityNumber);

  const { data: byIdentity } = await admin
    .from('employee_registration_requests')
    .select('id')
    .eq('identity_type', input.identityType)
    .eq('identity_lookup_hash', identityHash)
    .eq('status', 'pending')
    .maybeSingle();

  const { data: byEmail } = await admin
    .from('employee_registration_requests')
    .select('id')
    .ilike('email', email)
    .eq('status', 'pending')
    .maybeSingle();

  if (byIdentity && byEmail && byIdentity.id !== byEmail.id) {
    throw new Error(strings.conflictingPendingApplications);
  }

  return byIdentity?.id ?? byEmail?.id ?? null;
}

async function pendingHasHash(
  admin: SupabaseClient,
  column: 'identity_lookup_hash' | 'tc_lookup_hash' | 'phone_lookup_hash' | 'iban_lookup_hash',
  hash: string,
  excludeRegistrationId?: string,
  identityType?: IdentityType
): Promise<boolean> {
  let query = admin
    .from('employee_registration_requests')
    .select('id')
    .eq(column, hash)
    .eq('status', 'pending');
  if (identityType && column === 'identity_lookup_hash') {
    query = query.eq('identity_type', identityType);
  }
  if (excludeRegistrationId) {
    query = query.neq('id', excludeRegistrationId);
  }
  const { data } = await query.maybeSingle();
  return Boolean(data);
}

/** E-posta, telefon, kimlik ve IBAN başka personel/başvuruda kullanılamaz */
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
    throw new Error(strings.emailEmployeeExists);
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
    throw new Error(strings.emailPendingApplication);
  }

  if (
    await sensitiveHasHash(
      admin,
      'identity_lookup_hash',
      hashes.identityLookupHash,
      input.excludeEmployeeId,
      input.identityType
    )
  ) {
    throw new Error(
      input.identityType === 'tc' ? strings.tcEmployeeExists : strings.foreignEmployeeExists
    );
  }
  if (
    await pendingHasHash(
      admin,
      'identity_lookup_hash',
      hashes.identityLookupHash,
      input.excludeRegistrationId,
      input.identityType
    )
  ) {
    throw new Error(
      input.identityType === 'tc' ? strings.tcPendingApplication : strings.foreignPendingApplication
    );
  }

  if (hashes.phoneLookupHash) {
    if (await employeeHasHash(admin, 'phone_lookup_hash', hashes.phoneLookupHash, input.excludeEmployeeId)) {
      throw new Error(strings.phoneEmployeeExists);
    }
    if (
      await pendingHasHash(admin, 'phone_lookup_hash', hashes.phoneLookupHash, input.excludeRegistrationId)
    ) {
      throw new Error(strings.phonePendingApplication);
    }
  }

  if (hashes.ibanLookupHash) {
    if (
      await sensitiveHasHash(admin, 'iban_lookup_hash', hashes.ibanLookupHash, input.excludeEmployeeId)
    ) {
      throw new Error(strings.ibanEmployeeExists);
    }
    if (
      await pendingHasHash(admin, 'iban_lookup_hash', hashes.ibanLookupHash, input.excludeRegistrationId)
    ) {
      throw new Error(strings.ibanPendingApplication);
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
      throw new Error(strings.invalidEmail);
    }
    const { data: existingEmail } = await admin
      .from('employees')
      .select('id')
      .ilike('email', email)
      .neq('id', input.excludeEmployeeId)
      .maybeSingle();
    if (existingEmail) {
      throw new Error(strings.emailEmployeeExists);
    }

    const { data: pendingEmail } = await admin
      .from('employee_registration_requests')
      .select('id')
      .ilike('email', email)
      .eq('status', 'pending')
      .maybeSingle();
    if (pendingEmail) {
      throw new Error(strings.emailPendingOnly);
    }
    result.email = email;
  }

  if (input.phone !== undefined) {
    const phone = input.phone?.trim() || null;
    if (phone && !validateInternationalPhone(phone)) {
      throw new Error(strings.invalidPhone);
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
        throw new Error(strings.phoneEmployeeExists);
      }

      const { data: pendingPhone } = await admin
        .from('employee_registration_requests')
        .select('id')
        .eq('phone_lookup_hash', phoneLookupHash)
        .eq('status', 'pending')
        .maybeSingle();
      if (pendingPhone) {
        throw new Error(strings.phonePendingApplication);
      }
    }
    result.phoneLookupHash = phoneLookupHash;
  }

  return result;
}

export function mapIdentityUniqueViolation(message: string): string | null {
  const lower = message.toLowerCase();
  if (lower.includes('employees_email_unique')) {
    return strings.emailEmployeeExists;
  }
  if (lower.includes('employees_phone_lookup_hash')) {
    return strings.phoneEmployeeExists;
  }
  if (lower.includes('employee_sensitive_data_tc_lookup_hash')) {
    return strings.tcEmployeeExists;
  }
  if (lower.includes('employee_sensitive_data_identity_lookup_hash')) {
    return strings.foreignEmployeeExists;
  }
  if (lower.includes('employee_sensitive_data_iban_lookup_hash')) {
    return strings.ibanEmployeeExists;
  }
  if (lower.includes('employee_registration_requests_email_pending')) {
    return strings.emailPendingOnly;
  }
  if (lower.includes('employee_registration_requests_tc_pending')) {
    return strings.tcPendingApplication;
  }
  if (lower.includes('employee_registration_requests_identity_pending')) {
    return strings.foreignPendingApplication;
  }
  if (lower.includes('employee_registration_requests_phone_pending')) {
    return strings.phonePendingApplication;
  }
  if (lower.includes('employee_registration_requests_iban_pending')) {
    return strings.ibanPendingApplication;
  }
  return null;
}
