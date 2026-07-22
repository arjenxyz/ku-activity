import type { SupabaseClient } from '@supabase/supabase-js';

export async function reportDayAbsence(
  admin: SupabaseClient,
  params: { employeeId: string; projectId: string; workDate: string }
): Promise<void> {
  const workDate = params.workDate.slice(0, 10);
  const { error } = await admin.from('attendance_day_absences').upsert(
    {
      employee_id: params.employeeId,
      project_id: params.projectId,
      work_date: workDate,
    },
    { onConflict: 'employee_id,project_id,work_date' }
  );

  if (error && !error.message.includes('attendance_day_absences')) {
    throw new Error(error.message);
  }
}

export async function clearDayAbsence(
  admin: SupabaseClient,
  params: { employeeId: string; projectId: string; workDate: string }
): Promise<void> {
  const { error } = await admin
    .from('attendance_day_absences')
    .delete()
    .eq('employee_id', params.employeeId)
    .eq('project_id', params.projectId)
    .eq('work_date', params.workDate.slice(0, 10));

  if (error && !error.message.includes('attendance_day_absences')) {
    throw new Error(error.message);
  }
}

export async function hasDayAbsence(
  admin: SupabaseClient,
  params: { employeeId: string; projectId: string; workDate: string }
): Promise<boolean> {
  const { data, error } = await admin
    .from('attendance_day_absences')
    .select('id')
    .eq('employee_id', params.employeeId)
    .eq('project_id', params.projectId)
    .eq('work_date', params.workDate.slice(0, 10))
    .maybeSingle();

  if (error) {
    if (error.message.includes('attendance_day_absences')) return false;
    throw new Error(error.message);
  }

  return Boolean(data);
}

export async function listDayAbsenceEmployeeIds(
  admin: SupabaseClient,
  projectId: string,
  workDate: string
): Promise<Set<string>> {
  const { data, error } = await admin
    .from('attendance_day_absences')
    .select('employee_id')
    .eq('project_id', projectId)
    .eq('work_date', workDate.slice(0, 10));

  if (error) {
    if (error.message.includes('attendance_day_absences')) return new Set();
    throw new Error(error.message);
  }

  return new Set((data ?? []).map((row) => row.employee_id as string));
}

/** Personelin ay içindeki işe çıkmama / izin bildirim tarihleri */
export async function listEmployeeAbsenceDatesInMonth(
  admin: SupabaseClient,
  params: { employeeId: string; projectId: string; month: string }
): Promise<string[]> {
  const month = params.month.slice(0, 7);
  const start = `${month}-01`;
  const [y, m] = month.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const end = `${month}-${String(lastDay).padStart(2, '0')}`;

  const { data, error } = await admin
    .from('attendance_day_absences')
    .select('work_date')
    .eq('employee_id', params.employeeId)
    .eq('project_id', params.projectId)
    .gte('work_date', start)
    .lte('work_date', end);

  if (error) {
    if (error.message.includes('attendance_day_absences')) return [];
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => String(row.work_date).slice(0, 10));
}
