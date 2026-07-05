import type { SupabaseClient } from '@supabase/supabase-js';
import {
  decryptField,
  hashIdentityLookup,
  normalizeIdentityNumber,
  type IdentityType,
} from '@/lib/field-encryption';

export type LoginEmployee = {
  id: string;
  project_id: string;
  pin_hash: string | null;
  is_active: boolean;
};

function normalizeRpcRows<T>(data: T | T[] | null | undefined): T[] {
  if (data == null) return [];
  return Array.isArray(data) ? data : [data];
}

async function loadEmployee(
  admin: SupabaseClient,
  employeeId: string
): Promise<LoginEmployee | null> {
  const { data, error } = await admin
    .from('employees')
    .select('id, project_id, pin_hash, is_active')
    .eq('id', employeeId)
    .maybeSingle();

  if (error || !data) return null;
  return data as LoginEmployee;
}

/** Hash eşleşmezse veya eksikse — şifreli kimlik ile eşleştirip hash'leri tamamlar */
async function findEmployeeByDecryptedIdentity(
  admin: SupabaseClient,
  identityType: IdentityType,
  normalized: string,
  identityLookupHash: string,
  tcLookupHash: string | null
): Promise<LoginEmployee | null> {
  let query = admin
    .from('employee_sensitive_data')
    .select('employee_id, tc_kimlik_enc, identity_number_enc, identity_type');

  if (identityType === 'tc') {
    query = query.or('identity_type.eq.tc,identity_type.is.null');
  } else {
    query = query.eq('identity_type', identityType);
  }

  const { data: rows, error } = await query;
  if (error || !rows?.length) return null;

  for (const row of rows) {
    try {
      const enc =
        (row.identity_number_enc as string | null) ?? (row.tc_kimlik_enc as string | null);
      if (!enc) continue;

      const plain = normalizeIdentityNumber(identityType, decryptField(enc));
      if (plain !== normalized) continue;

      const patch: Record<string, string> = {
        identity_type: identityType,
        identity_lookup_hash: identityLookupHash,
      };
      if (tcLookupHash) {
        patch.tc_lookup_hash = tcLookupHash;
      }

      await admin.from('employee_sensitive_data').update(patch).eq('employee_id', row.employee_id);

      return loadEmployee(admin, row.employee_id as string);
    } catch {
      continue;
    }
  }

  return null;
}

export async function findEmployeeForIdentityLogin(
  admin: SupabaseClient,
  identityType: IdentityType,
  identityNumber: string
): Promise<LoginEmployee | null> {
  const normalized = normalizeIdentityNumber(identityType, identityNumber);
  const identityLookupHash = hashIdentityLookup(identityType, normalized);
  const tcLookupHash = identityType === 'tc' ? identityLookupHash : null;

  const { data: byIdentityRows, error: byIdentityError } = await admin.rpc(
    'get_employee_for_login_by_identity',
    {
      p_identity_type: identityType,
      p_identity_lookup_hash: identityLookupHash,
    }
  );

  if (!byIdentityError) {
    const rows = normalizeRpcRows(byIdentityRows);
    if (rows.length > 0) return rows[0] as LoginEmployee;
  }

  if (tcLookupHash) {
    const { data: rpcRows, error: rpcError } = await admin.rpc('get_employee_for_login_by_tc', {
      p_tc_lookup_hash: tcLookupHash,
    });

    if (!rpcError) {
      const rows = normalizeRpcRows(rpcRows);
      if (rows.length > 0) return rows[0] as LoginEmployee;
    } else {
      console.warn('get_employee_for_login_by_tc RPC:', rpcError.message);
    }

    const { data: byTcHash } = await admin
      .from('employee_sensitive_data')
      .select('employee_id')
      .eq('tc_lookup_hash', tcLookupHash)
      .maybeSingle();

    if (byTcHash?.employee_id) {
      const employee = await loadEmployee(admin, byTcHash.employee_id);
      if (employee) return employee;
    }
  }

  let sensitiveQuery = admin
    .from('employee_sensitive_data')
    .select('employee_id')
    .eq('identity_lookup_hash', identityLookupHash);

  if (identityType === 'tc') {
    sensitiveQuery = sensitiveQuery.or('identity_type.eq.tc,identity_type.is.null');
  } else {
    sensitiveQuery = sensitiveQuery.eq('identity_type', identityType);
  }

  const { data: sensitive } = await sensitiveQuery.maybeSingle();

  if (sensitive?.employee_id) {
    const employee = await loadEmployee(admin, sensitive.employee_id);
    if (employee) return employee;
  }

  return findEmployeeByDecryptedIdentity(
    admin,
    identityType,
    normalized,
    identityLookupHash,
    tcLookupHash
  );
}
