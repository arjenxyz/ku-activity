import type { Employee, AttendanceStats } from '@/types/adminTypes';
import type { PostgrestError } from '@supabase/supabase-js';
import dayjs from 'dayjs';
import { fetchProjectEmployees } from '@/lib/project-api';
import { getWorkLogApprovalStatus, totalPayUnits } from '@/lib/work-log';
import { isAdminDemoMode } from '@/lib/demo/demo-paths';
import { getDemoAdminWorkLogs } from '@/lib/demo/admin-demo-data';

type WorkLogSummary = {
  employee_id: string;
  date: string;
  amount: number;
  mesai_units?: number;
  approved?: boolean;
  admin_confirmed_at?: string | null;
  employee_confirmed_at?: string | null;
  employee_disputed_at?: string | null;
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

  let workLogs: WorkLogSummary[] = [];
  if (isAdminDemoMode()) {
    workLogs = getDemoAdminWorkLogs(selectedMonth).records;
  } else {
    const res = await fetch(
      `/api/admin/projects/${projectId}/work-logs?month=${encodeURIComponent(selectedMonth)}`
    );
    const workPayload = res.ok ? await res.json() : { records: [] };
    workLogs = (workPayload.records ?? []) as WorkLogSummary[];
  }

  const logs = workLogs.filter((w): w is WorkLogSummary => Boolean(w.employee_id));
  const presentDays = logs.filter((w) => Number(w.amount) > 0).length;

  const employeesWithMeta = employeesData.map((emp) => {
    const employeeLogs = logs.filter((w) => w.employee_id === emp.id);
    const daysInMonth = dayjs(selectedMonth).daysInMonth();
    const monthlyAttendance = Array.from({ length: daysInMonth }, (_, i) => {
      const date = dayjs(selectedMonth).date(i + 1).format('YYYY-MM-DD');
      const log = employeeLogs.find((w) => w.date === date);
      return log ? totalPayUnits(log.amount, log.mesai_units ?? 0) : 0;
    });

    const todayLog = employeeLogs.find((w) => w.date === today);
    const todayStatus = todayLog ? getWorkLogApprovalStatus(todayLog) : 'none';

    return {
      ...emp,
      today_verified: todayStatus === 'confirmed',
      today_attendance_status: todayStatus,
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

export type AdminAttendanceConfirmPayload = {
  employeeId: string;
  projectId: string;
  amount: number;
  mesaiType: 'none' | 'ceyrek' | 'yarim' | 'tam';
  date?: string;
  description?: string;
};

export const confirmAdminAttendance = async (
  payload: AdminAttendanceConfirmPayload
): Promise<{ error: PostgrestError | null }> => {
  const res = await fetch(`/api/admin/projects/${payload.projectId}/work-logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      employeeId: payload.employeeId,
      date: payload.date ?? dayjs().format('YYYY-MM-DD'),
      amount: payload.amount,
      mesaiType: payload.mesaiType,
      description: payload.description,
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
