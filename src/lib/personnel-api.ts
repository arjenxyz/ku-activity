import type { Deduction, MinimumWage, WorkLog } from '@/lib/personnel-stats';
import type { WorkLogApprovalStatus } from '@/lib/work-log';
import { normalizeMonthStats } from '@/lib/personnel-month-stats';

function personnelFetch(input: RequestInfo | URL, init?: RequestInit) {
  return fetch(input, { credentials: 'same-origin', ...init });
}

async function parseError(res: Response) {
  const data = await res.json().catch(() => ({}));
  return (data as { error?: string }).error || res.statusText;
}

export type PersonnelProject = {
  id: string;
  name: string;
  status: string;
  description: string | null;
  location: string | null;
  code: string | null;
  workStartTime: string | null;
  workEndTime: string | null;
};

export type PersonnelManager = {
  name: string | null;
  phone: string;
};

export type PersonnelEmployee = {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone: string | null;
  daily_wage: number;
  position: string;
  hire_date: string | null;
  photo_url?: string | null;
  tc_kimlik?: string | null;
  birth_date?: string | null;
  iban?: string | null;
  iban_masked?: string | null;
  project_id: string;
  project_name?: string;
  project?: PersonnelProject | null;
  manager?: PersonnelManager | null;
};

export type MonthStats = {
  month: string;
  work_days: number;
  approved_days: number;
  pending_days: number;
  mesai_units: number;
  mesai_pay: number;
  base_pay: number;
  gross_pay: number;
  total_advances: number;
  total_deductions: number;
  total_minimum: number;
  net_pay: number;
};

function monthQuery(month?: string) {
  return month ? `?month=${encodeURIComponent(month)}` : '';
}

export async function fetchPersonnelMe() {
  const res = await personnelFetch('/api/personnel/me');
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return data.employee as PersonnelEmployee;
}

export async function fetchPersonnelWorkLogs(month?: string) {
  const res = await personnelFetch(`/api/personnel/work-logs${monthQuery(month)}`);
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return (data.workLogs ?? []) as WorkLog[];
}

export async function fetchPersonnelAbsenceDates(month?: string) {
  const res = await personnelFetch(`/api/personnel/attendance/absences${monthQuery(month)}`);
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return (data.dates ?? []) as string[];
}

export async function fetchPersonnelDeductions(month?: string) {
  const res = await personnelFetch(`/api/personnel/deductions${monthQuery(month)}`);
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return (data.deductions ?? []) as Deduction[];
}

export async function fetchPersonnelMinimumWages(month?: string) {
  const res = await personnelFetch(`/api/personnel/minimum-wages${monthQuery(month)}`);
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return (data.records ?? []) as MinimumWage[];
}

export async function fetchPersonnelMonthStats(month: string) {
  const res = await personnelFetch(`/api/personnel/summary?month=${encodeURIComponent(month)}`);
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return normalizeMonthStats((data.stats ?? {}) as Record<string, unknown>, month);
}

export async function fetchPersonnelTodayAttendance() {
  const res = await personnelFetch('/api/personnel/work-logs/today');
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{
    date: string;
    status: WorkLogApprovalStatus;
    workLog: { amount: number; mesai_type: string } | null;
    project: {
      name: string;
      workStartTime: string | null;
      workEndTime: string | null;
    } | null;
  }>;
}

export async function confirmPersonnelAttendance(date?: string, amount?: number) {
  const res = await personnelFetch('/api/personnel/work-logs/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, amount }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return data as {
    status: WorkLogApprovalStatus;
    record: { amount: number; mesai_type: string };
  };
}

export async function disputePersonnelWorkLog(recordId: string, note: string) {
  const res = await personnelFetch(`/api/personnel/work-logs/${encodeURIComponent(recordId)}/dispute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function scanAttendanceQr(token: string, options?: { replace?: boolean }) {
  const res = await personnelFetch('/api/personnel/attendance-qr/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, replace: options?.replace === true }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      errorCode?: string;
    };
    const err = new Error(data.error || res.statusText) as Error & { code?: string };
    err.code = data.errorCode;
    throw err;
  }
  return res.json() as Promise<{
    ok: boolean;
    alreadyListed?: boolean;
    replaced?: boolean;
    message?: string;
    messageCode?: string;
    workDate?: string;
    status?: PersonnelAttendanceStatusPayload;
  }>;
}

export type PersonnelAttendanceStatusPayload = {
  workDate: string;
  state: 'none' | 'waiting' | 'completed' | 'cancelled' | 'removed' | 'did_not_work';
  listedAt: string | null;
  completedAt: string | null;
  message: string;
  messageCode?: string;
  window?: {
    workDate: string;
    timezone: string;
    workStartTime: string;
    workEndTime: string;
    windowStart: string;
    windowEnd: string;
    windowStartLabel: string;
    windowEndLabel: string;
    isOpen: boolean;
    currentOpenWorkDate: string | null;
    message: string;
  };
};

export async function fetchPersonnelAttendanceStatus(date?: string) {
  const q = date ? `?date=${encodeURIComponent(date)}` : '';
  const res = await personnelFetch(`/api/personnel/attendance-qr/status${q}`);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<PersonnelAttendanceStatusPayload>;
}

export async function changePersonnelPassword(currentPassword: string, newPassword: string) {
  const res = await personnelFetch('/api/personnel/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}
