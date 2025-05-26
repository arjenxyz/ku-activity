import { supabase } from '../app/lib/supabaseClient';
import type { Employee, AttendanceStats } from '@/types/adminTypes';
import dayjs from 'dayjs';

type RawEmployee = {
  position: string | null;
};

type AttendanceRecord = {
  status: 'present' | 'absent' | 'late';
  date: string;
  employee_id: string;
};

export const fetchEmployees = async (
  projectId: string,
  selectedMonth: string
): Promise<{
  departments: string[];
  employees: Employee[];
  attendanceStats: AttendanceStats;
}> => {
  const monthStart = dayjs(selectedMonth).startOf('month').format('YYYY-MM-DD');
  const monthEnd = dayjs(selectedMonth).endOf('month').format('YYYY-MM-DD');

  // Departmanlar
  const { data: deptData } = await supabase
    .from('employees')
    .select('position')
    .eq('project_id', projectId)
    .neq('position', null);

  const departments = (deptData as RawEmployee[] | null)?.map((d) => d.position) ?? [];
  
  // Çalışanlar
  const { data: employeesData } = await supabase
    .from('employees')
    .select('*')
    .eq('project_id', projectId);

  // Katılım verileri
  const { data: attendanceData } = await supabase
    .from('attendance')
    .select('*')
    .gte('date', monthStart)
    .lte('date', monthEnd);

  const stats = {
    present: (attendanceData as AttendanceRecord[] | null)?.filter(a => a.status === 'present').length ?? 0,
    absent: (attendanceData as AttendanceRecord[] | null)?.filter(a => a.status === 'absent').length ?? 0,
    late: (attendanceData as AttendanceRecord[] | null)?.filter(a => a.status === 'late').length ?? 0,
  };

  return {
    departments: [...new Set(departments.filter(Boolean))] as string[],
    employees: (employeesData as Employee[]) ?? [],
    attendanceStats: stats
  };
};

export const verifyDailyAttendance = async (
  employeeId: string
): Promise<{ error: any }> => {
  const { error } = await supabase
    .from('attendance')
    .insert([{
      employee_id: employeeId,
      date: dayjs().format('YYYY-MM-DD'),
      status: 'present'
    }]);

  return { error };
};
