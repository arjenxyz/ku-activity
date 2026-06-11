import type { Employee, AttendanceStats } from '@/types/adminTypes';
import type { PostgrestError } from '@supabase/supabase-js';
import dayjs from 'dayjs';
import { fetchProjectEmployees } from '@/lib/project-api';

type WorkLogSummary = {
  employee_id: string;
  date: string;
  amount: number;
};

export const fetchEmployees = async (
  projectId: string,
  selectedMonth: string
): Promise<{
  departments: string[];
  employees: Employee[];
  attendanceStats: AttendanceStats;
}> => {
  const today = dayjs().format('YYYY-MM-DD');

  const employeesData = (await fetchProjectEmployees(projectId)).map((e) => ({
    ...e,
    email: e.email ?? '',
    phone: e.phone ?? '',
    position: e.position ?? '',
    hire_date: e.hire_date ?? '',
    project_id: e.project_id ?? projectId,
  })) as Employee[];

  const res = await fetch(
    `/api/admin/projects/${projectId}/work-logs?month=${encodeURIComponent(selectedMonth)}`
  );
  const workPayload = res.ok ? await res.json() : { records: [] };
  const workLogs = (workPayload.records ?? []) as Array<{
    employee_id: string;
    date: string;
    amount: number;
  }>;

  const logs = workLogs.filter((w): w is WorkLogSummary => Boolean(w.employee_id));
  const presentDays = logs.filter((w) => Number(w.amount) > 0).length;

  const todayVerifiedIds = new Set(
    logs.filter((w) => w.date === today && Number(w.amount) > 0).map((w) => w.employee_id)
  );

  const employeesWithMeta = employeesData.map((emp) => {
    const employeeLogs = logs.filter((w) => w.employee_id === emp.id);
    const daysInMonth = dayjs(selectedMonth).daysInMonth();
    const monthlyAttendance = Array.from({ length: daysInMonth }, (_, i) => {
      const date = dayjs(selectedMonth).date(i + 1).format('YYYY-MM-DD');
      const log = employeeLogs.find((w) => w.date === date);
      return log ? Number(log.amount) : 0;
    });

    return {
      ...emp,
      today_verified: todayVerifiedIds.has(emp.id),
      monthly_attendance: monthlyAttendance,
    } as Employee;
  });

  const stats: AttendanceStats = {
    present: presentDays,
    absent: Math.max(0, employeesData.length * dayjs(selectedMonth).daysInMonth() - presentDays),
    late: 0,
  };

  return {
    departments: [...new Set(employeesData.map((d) => d.position).filter(Boolean))] as string[],
    employees: employeesWithMeta,
    attendanceStats: stats,
  };
};

export const verifyDailyAttendance = async (
  employeeId: string,
  projectId: string
): Promise<{ error: PostgrestError | null }> => {
  const res = await fetch(`/api/admin/projects/${projectId}/work-logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      employeeId,
      date: dayjs().format('YYYY-MM-DD'),
      amount: 1,
      approved: false,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return {
      error: {
        message: (data as { error?: string }).error || res.statusText,
        details: '',
        hint: '',
        code: '',
      } as PostgrestError,
    };
  }

  return { error: null };
};
