import dayjs from 'dayjs';
import { getWorkLogApprovalStatus, totalPayUnits, type MesaiType } from '@/lib/work-log';

export type WorkLog = {
  id: string;
  date: string;
  amount: number;
  mesai_type?: MesaiType | string | null;
  mesai_units?: number;
  description: string | null;
  approved?: boolean;
  admin_confirmed_at?: string | null;
  employee_confirmed_at?: string | null;
};

export type Deduction = {
  id: string;
  date: string;
  type: string;
  amount: number;
  description: string | null;
};

export type MinimumWage = {
  id: string;
  date: string;
  amount: number;
  description: string | null;
};

export type PersonnelStats = {
  workDays: number;
  approvedDays: number;
  pendingDays: number;
  gross: number;
  totalAdvance: number;
  totalDeduct: number;
  totalMinimum: number;
  net: number;
};

export function workDayLabel(amount: number, mesaiType?: MesaiType | string | null) {
  const base = amount === 1 ? 'Tam gün' : amount === 0.5 ? 'Yarım gün' : `${amount} gün`;
  if (!mesaiType || mesaiType === 'none') return base;
  if (mesaiType === 'ceyrek') return `${base} + çeyrek mesai`;
  if (mesaiType === 'yarim') return `${base} + yarım mesai`;
  if (mesaiType === 'tam') return `${base} + tam mesai`;
  return base;
}

export function deductionTypeLabel(type: string) {
  const map: Record<string, string> = {
    advance: 'Avans',
    deduction: 'Kesinti',
    other: 'Diğer',
    subcontractor_cut: 'Taşeron kesintisi',
    minimum: 'Asgari',
  };
  return map[type] ?? type;
}

function payUnitsForLog(w: WorkLog): number {
  return totalPayUnits(w.amount, w.mesai_units ?? 0);
}

export function computePersonnelStats(
  workLogs: WorkLog[],
  deductions: Deduction[],
  dailyWage: number,
  minimumWages: MinimumWage[] = []
): PersonnelStats {
  const workDays = workLogs.reduce((s, w) => s + payUnitsForLog(w), 0);
  const approvedDays = workLogs
    .filter((w) => w.approved === true)
    .reduce((s, w) => s + payUnitsForLog(w), 0);
  const pendingDays = workLogs
    .filter((w) => w.approved !== true)
    .reduce((s, w) => s + payUnitsForLog(w), 0);
  const gross = workDays * dailyWage;
  const totalAdvance = deductions
    .filter((d) => d.type === 'advance')
    .reduce((s, d) => s + Number(d.amount), 0);
  const totalDeduct = deductions
    .filter((d) => d.type !== 'advance')
    .reduce((s, d) => s + Number(d.amount), 0);
  const totalMinimum = minimumWages.reduce((s, m) => s + Number(m.amount), 0);
  const net = gross - totalAdvance - totalDeduct;

  return {
    workDays,
    approvedDays,
    pendingDays,
    gross,
    totalAdvance,
    totalDeduct,
    totalMinimum,
    net,
  };
}

export type CalendarDay = {
  date: string;
  day: number;
  inMonth: boolean;
  workAmount: number;
  approved: boolean | null;
  approvalStatus: ReturnType<typeof getWorkLogApprovalStatus> | null;
};

export function buildMonthCalendar(month: string, workLogs: WorkLog[]): CalendarDay[] {
  const start = dayjs(`${month}-01`);
  const daysInMonth = start.daysInMonth();
  const firstDow = start.day();
  const mondayFirstOffset = (firstDow + 6) % 7;
  const cells: CalendarDay[] = [];

  for (let i = 0; i < mondayFirstOffset; i++) {
    cells.push({
      date: '',
      day: 0,
      inMonth: false,
      workAmount: 0,
      approved: null,
      approvalStatus: null,
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = start.date(d).format('YYYY-MM-DD');
    const log = workLogs.find((w) => w.date === date);
    cells.push({
      date,
      day: d,
      inMonth: true,
      workAmount: log ? payUnitsForLog(log) : 0,
      approved: log ? log.approved === true : null,
      approvalStatus: log ? getWorkLogApprovalStatus(log) : null,
    });
  }

  return cells;
}

export function currentMonth() {
  return dayjs().format('YYYY-MM');
}
