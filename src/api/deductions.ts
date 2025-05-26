import { supabase } from '../app/lib/supabaseClient';
import type { Deduction } from '@/types/adminTypes';

export const fetchDeductions = async (projectId: string) => {
  const { data, error } = await supabase
    .from('deductions')
    .select('id, employee_id, date, type, amount, description, employee:employee_id(id, name)')
    .eq('project_id', projectId)
    .order('date', { ascending: false });

  return data?.map((d: any) => ({
    ...d,
    employee: Array.isArray(d.employee) ? d.employee[0] : d.employee
  })) as Deduction[] || [];
};

export const deleteDeduction = async (deductionId: string) => {
  return await supabase
    .from('deductions')
    .delete()
    .eq('id', deductionId);
};