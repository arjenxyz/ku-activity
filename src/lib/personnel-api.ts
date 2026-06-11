import type { Deduction, MinimumWage, WorkLog } from '@/lib/personnel-stats';

async function parseError(res: Response) {
  const data = await res.json().catch(() => ({}));
  return (data as { error?: string }).error || res.statusText;
}

export type PersonnelEmployee = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  daily_wage: number;
  position: string;
  hire_date: string | null;
  photo_url?: string | null;
  project_id: string;
  project_name?: string;
};

export type MonthStats = {
  month: string;
  work_days: number;
  approved_days: number;
  pending_days: number;
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
  const res = await fetch('/api/personnel/me');
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return data.employee as PersonnelEmployee;
}

export async function fetchPersonnelWorkLogs(month?: string) {
  const res = await fetch(`/api/personnel/work-logs${monthQuery(month)}`);
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return (data.workLogs ?? []) as WorkLog[];
}

export async function fetchPersonnelDeductions(month?: string) {
  const res = await fetch(`/api/personnel/deductions${monthQuery(month)}`);
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return (data.deductions ?? []) as Deduction[];
}

export async function fetchPersonnelMinimumWages(month?: string) {
  const res = await fetch(`/api/personnel/minimum-wages${monthQuery(month)}`);
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return (data.records ?? []) as MinimumWage[];
}

export async function fetchPersonnelMonthStats(month: string) {
  const res = await fetch(`/api/personnel/summary?month=${encodeURIComponent(month)}`);
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return data.stats as MonthStats;
}

export async function changePersonnelPassword(currentPassword: string, newPassword: string) {
  const res = await fetch('/api/personnel/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}
