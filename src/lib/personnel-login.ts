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

/** tc_lookup_hash eksik eski kayıtlar — şifreli T.C. ile eşleştirip hash'i tamamlar */
async function findEmployeeByDecryptedTc(
  admin: SupabaseClient,
  tc: string,
  tcLookupHash: string
): Promise<LoginEmployee | null> {
  const { data: rows, error } = await admin
    .from('employee_sensitive_data')
    .select('employee_id, tc_kimlik_enc')
    .is('tc_lookup_hash', null);

  if (error || !rows?.length) return null;

  for (const row of rows) {
    try {
      const plain = decryptField(row.tc_kimlik_enc).replace(/\D/g, '');
      if (plain !== tc) continue;

      await admin
        .from('employee_sensitive_data')
        .update({ tc_lookup_hash: tcLookupHash })
        .eq('employee_id', row.employee_id);

      return loadEmployee(admin, row.employee_id);
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
  }

  const { data: sensitive } = await admin
    .from('employee_sensitive_data')
    .select('employee_id')
    .eq('identity_type', identityType)
    .eq('identity_lookup_hash', identityLookupHash)
    .maybeSingle();

  if (sensitive?.employee_id) {
    const employee = await loadEmployee(admin, sensitive.employee_id);
    if (employee) return employee;
  }

  if (tcLookupHash) {
    return findEmployeeByDecryptedTc(admin, normalized, tcLookupHash);
  }
  return null;
}
