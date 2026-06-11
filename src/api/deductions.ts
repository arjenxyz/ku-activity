import { supabase } from '../app/lib/supabaseClient';
import type { Deduction } from '@/types/adminTypes';

type RawDeduction = {
  id: string;
  employee_id: string;
  date: string;
  type: string;
  amount: number;
  description: string;
  employee: { id: string; name: string }[] | { id: string; name: string };
};

export const fetchDeductions = async (projectId: string): Promise<Deduction[]> => {
  const { data, error } = await supabase
    .from('deductions')
    .select('id, employee_id, date, type, amount, description, employee:employee_id(id, name)')
    .eq('project_id', projectId)
    .order('date', { ascending: false });

  if (error) {
    console.error('Veri alınırken hata oluştu:', error.message);
    return [];
  }

  return (data as RawDeduction[])?.map((d) => ({
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
