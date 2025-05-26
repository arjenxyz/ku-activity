import { supabase } from '../app/lib/supabaseClient';
import type { WorkLog } from '@/types/adminTypes';
import type { PostgrestError } from '@supabase/supabase-js';

export const fetchWorkLogs = async (
  projectId: string
): Promise<WorkLog[]> => {
  const { data, error } = await supabase
    .from('work_logs')
    .select(`
      id,
      employee_id,
      date,
      amount,
      description,
      employee:employee_id (id, name)
    `)
    .eq('project_id', projectId)
    .order('date', { ascending: false });

  if (error) {
    console.error('Supabase error:', error);
  }

  return data?.map(log => ({
    ...log,
    employee: Array.isArray(log.employee) ? log.employee[0] : log.employee
  })) as WorkLog[] || [];
};

export const createWorkLog = async (
  logData: Omit<WorkLog, 'id' | 'employee'> & { project_id: string }
): Promise<{ error: PostgrestError | null }> => {
  const { error } = await supabase
    .from('work_logs')
    .insert([logData]);
  return { error };
};

export const deleteWorkLog = async (
  logId: string
): Promise<{ error: PostgrestError | null }> => {
  const { error } = await supabase
    .from('work_logs')
    .delete()
    .eq('id', logId);
  return { error };
};

