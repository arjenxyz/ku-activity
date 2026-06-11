import type { SupabaseClient } from '@supabase/supabase-js';

export type EmployeeRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  position: string | null;
  daily_wage: number;
  is_active: boolean;
  hire_date: string | null;
  project_id?: string;
  photo_url?: string | null;
  is_system_account?: boolean;
};

const BASE_FIELDS =
  'id, name, email, phone, position, daily_wage, is_active, hire_date, project_id';

function isMissingColumnError(message: string) {
  return (
    message.includes('photo_url') ||
    message.includes('is_system_account') ||
    message.includes('does not exist')
  );
}

function excludeSystemAccounts(rows: EmployeeRow[]) {
  return rows.filter((e) => e.is_system_account !== true);
}

/** Proje personelleri — eksik kolonlarda da çalışır */
export async function queryProjectEmployees(
  supabase: SupabaseClient,
  projectId: string
): Promise<{ data: EmployeeRow[]; error: string | null }> {
  const extended = await supabase
    .from('employees')
    .select(`${BASE_FIELDS}, photo_url, is_system_account`)
    .eq('project_id', projectId)
    .order('name');

  if (!extended.error) {
    return { data: excludeSystemAccounts((extended.data ?? []) as EmployeeRow[]), error: null };
  }

  if (!isMissingColumnError(extended.error.message)) {
    return { data: [], error: extended.error.message };
  }

  const basic = await supabase
    .from('employees')
    .select(BASE_FIELDS)
    .eq('project_id', projectId)
    .order('name');

  if (basic.error) {
    return { data: [], error: basic.error.message };
  }

  return { data: (basic.data ?? []) as EmployeeRow[], error: null };
}

/** Tek personel — personel paneli */
export async function queryEmployeeById(
  supabase: SupabaseClient,
  employeeId: string
): Promise<{ data: EmployeeRow | null; error: string | null }> {
  const extended = await supabase
    .from('employees')
    .select(`${BASE_FIELDS}, photo_url`)
    .eq('id', employeeId)
    .maybeSingle();

  if (!extended.error && extended.data) {
    return { data: extended.data as EmployeeRow, error: null };
  }

  if (extended.error && !isMissingColumnError(extended.error.message)) {
    return { data: null, error: extended.error.message };
  }

  const basic = await supabase
    .from('employees')
    .select(BASE_FIELDS)
    .eq('id', employeeId)
    .maybeSingle();

  if (basic.error) {
    return { data: null, error: basic.error.message };
  }

  return { data: (basic.data as EmployeeRow) ?? null, error: null };
}

/** Personel profil view */
export async function queryPersonnelProfile(
  supabase: SupabaseClient,
  employeeId: string
): Promise<{
  data: {
    employee_id: string;
    name: string;
    email: string | null;
    phone: string | null;
    daily_wage: number;
    position: string | null;
    hire_date: string | null;
    photo_url?: string | null;
    project_id: string;
    project_name: string;
  } | null;
  error: string | null;
}> {
  const core =
    'employee_id, name, email, phone, daily_wage, position, hire_date, project_id, project_name';

  const extended = await supabase
    .from('v_personnel_employee_profile')
    .select(`${core}, photo_url`)
    .eq('employee_id', employeeId)
    .maybeSingle();

  if (!extended.error && extended.data) {
    return { data: extended.data, error: null };
  }

  if (extended.error && !isMissingColumnError(extended.error.message)) {
    return { data: null, error: extended.error.message };
  }

  const basic = await supabase
    .from('v_personnel_employee_profile')
    .select(core)
    .eq('employee_id', employeeId)
    .maybeSingle();

  if (basic.error) {
    return { data: null, error: basic.error.message };
  }

  return { data: basic.data, error: null };
}
