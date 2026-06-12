import type { SupabaseClient } from '@supabase/supabase-js';
import { decryptField, hashTcKimlik } from '@/lib/field-encryption';

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

export async function findEmployeeForTcLogin(
  admin: SupabaseClient,
  tc: string
): Promise<LoginEmployee | null> {
  const tcLookupHash = hashTcKimlik(tc);

  const { data: rpcRows, error: rpcError } = await admin.rpc('get_employee_for_login_by_tc', {
    p_tc_lookup_hash: tcLookupHash,
  });

  if (!rpcError) {
    const rows = normalizeRpcRows(rpcRows);
    if (rows.length > 0) return rows[0] as LoginEmployee;
  } else {
    console.warn('get_employee_for_login_by_tc RPC:', rpcError.message);
  }

  const { data: sensitive } = await admin
    .from('employee_sensitive_data')
    .select('employee_id')
    .eq('tc_lookup_hash', tcLookupHash)
    .maybeSingle();

  if (sensitive?.employee_id) {
    const employee = await loadEmployee(admin, sensitive.employee_id);
    if (employee) return employee;
  }

  return findEmployeeByDecryptedTc(admin, tc, tcLookupHash);
}
