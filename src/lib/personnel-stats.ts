import dayjs from 'dayjs';
import strings from '@json/src/lib/personnel-stats.json';
import { computeNetPay } from '@/lib/minimum-wage';
import { formatString } from '@/lib/strings/format';
import { getWorkLogApprovalStatus, type MesaiType } from '@/lib/work-log';

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
  employee_dispute_note?: string | null;
  employee_disputed_at?: string | null;
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
  mesaiUnits: number;
  mesaiPay: number;
  basePay: number;
  gross: number;
  totalAdvance: number;
  totalDeduct: number;
  totalMinimum: number;
  net: number;
};

export type MesaiTypeStats = {
  count: number;
  units: number;
  pay: number;
};

export type MesaiStats = {
  totalPay: number;
  totalUnits: number;
  recordCount: number;
  byType: Record<'ceyrek' | 'yarim' | 'tam', MesaiTypeStats>;
  logs: WorkLog[];
};

export function workDayLabel(amount: number, mesaiType?: MesaiType | string | null) {
  const base =
    amount === 1
      ? strings.workDay.fullDay
      : amount === 0.5
        ? strings.workDay.halfDay
        : formatString(strings.workDay.dayAmount, { amount });
  if (!mesaiType || mesaiType === 'none') return base;
  if (mesaiType === 'ceyrek') return formatString(strings.workDay.mesaiCeyrek, { base });
  if (mesaiType === 'yarim') return formatString(strings.workDay.mesaiYarim, { base });
  if (mesaiType === 'tam') return formatString(strings.workDay.mesaiTam, { base });
  return base;
}

export function deductionTypeLabel(type: string) {
  const map = strings.deductionTypes as Record<string, string>;
  return map[type] ?? type;
}

export function workDayUnitsForLog(w: WorkLog): number {
  return Number(w.amount);
}

export function mesaiUnitsForLog(w: WorkLog): number {
  return Number(w.mesai_units ?? 0);
}

export function mesaiPayForLog(w: WorkLog, dailyWage: number): number {
  return mesaiUnitsForLog(w) * dailyWage;
}

export function hasMesai(w: WorkLog): boolean {
  return mesaiUnitsForLog(w) > 0;
}

export function computeMesaiStats(workLogs: WorkLog[], dailyWage: number): MesaiStats {
  const logs = workLogs.filter(hasMesai);
  const byType: MesaiStats['byType'] = {
    ceyrek: { count: 0, units: 0, pay: 0 },
    yarim: { count: 0, units: 0, pay: 0 },
    tam: { count: 0, units: 0, pay: 0 },
  };

  let totalUnits = 0;
  let totalPay = 0;

  for (const log of logs) {
    const units = mesaiUnitsForLog(log);
    const pay = mesaiPayForLog(log, dailyWage);
    totalUnits += units;
    totalPay += pay;
    const key = String(log.mesai_type) as keyof MesaiStats['byType'];
    if (key in byType) {
      byType[key].count += 1;
      byType[key].units += units;
      byType[key].pay += pay;
    }
  }

  return {
    totalPay,
    totalUnits,
    recordCount: logs.length,
    byType,
    logs,
  };
}

/** Özet şeridi için mesai adet satırları */
export function getMesaiCountLines(
  stats: Pick<MesaiStats, 'byType'>
): Array<{ count: number; label: string }> {
  return [
    { count: stats.byType.tam.count, label: strings.mesaiCountLines.tam },
    { count: stats.byType.ceyrek.count, label: strings.mesaiCountLines.ceyrek },
    { count: stats.byType.yarim.count, label: strings.mesaiCountLines.yarim },
  ];
}

/** Özet şeridi için çalışılan gün satırları */
export function getWorkDayCountLines(
  workLogs: WorkLog[]
): Array<{ count: number; label: string; display?: string }> {
  let full = 0;
  let half = 0;

  for (const log of workLogs) {
    const amount = Number(log.amount);
    if (amount === 1) full += 1;
    else if (amount === 0.5) half += 1;
  }

  const total = workLogs.reduce((s, w) => s + workDayUnitsForLog(w), 0);
  const totalDisplay = total % 1 === 0 ? String(total) : total.toFixed(1);

  return [
    { count: full, label: strings.workDayCountLines.full },
    { count: half, label: strings.workDayCountLines.half },
    { count: total, label: strings.workDayCountLines.total, display: totalDisplay },
  ];
}

export function computeGrossPay(
  workLogs: WorkLog[],
  dailyWage: number,
  options?: { approvedOnly?: boolean }
): { basePay: number; mesaiPay: number; gross: number; workDays: number; mesaiUnits: number } {
  const logs = options?.approvedOnly
    ? workLogs.filter((w) => w.approved === true)
    : workLogs;
  const workDays = logs.reduce((s, w) => s + workDayUnitsForLog(w), 0);
  const mesaiUnits = logs.reduce((s, w) => s + mesaiUnitsForLog(w), 0);
  const mesaiPay = logs.reduce((s, w) => s + mesaiPayForLog(w, dailyWage), 0);
  const basePay = workDays * dailyWage;
  const gross = basePay + mesaiPay;
  return { basePay, mesaiPay, gross, workDays, mesaiUnits };
}

export function computePersonnelStats(
  workLogs: WorkLog[],
  deductions: Deduction[],
  dailyWage: number,
  minimumWages: MinimumWage[] = []
): PersonnelStats {
  const workDays = workLogs.reduce((s, w) => s + workDayUnitsForLog(w), 0);
  const approvedDays = workLogs
    .filter((w) => w.approved === true)
    .reduce((s, w) => s + workDayUnitsForLog(w), 0);
  const pendingDays = workLogs
    .filter((w) => w.approved !== true)
    .reduce((s, w) => s + workDayUnitsForLog(w), 0);
  const mesaiUnits = workLogs.reduce((s, w) => s + mesaiUnitsForLog(w), 0);
  const mesaiPay = workLogs.reduce((s, w) => s + mesaiPayForLog(w, dailyWage), 0);
  const basePay = workDays * dailyWage;
  const gross = basePay + mesaiPay;
  const totalAdvance = deductions
    .filter((d) => d.type === 'advance')
    .reduce((s, d) => s + Number(d.amount), 0);
  const totalDeduct = deductions
    .filter((d) => d.type !== 'advance')
    .reduce((s, d) => s + Number(d.amount), 0);
  const totalMinimum = minimumWages.reduce((s, m) => s + Number(m.amount), 0);
  const net = computeNetPay(gross, totalAdvance, totalDeduct, totalMinimum);

  return {
    workDays,
    approvedDays,
    pendingDays,
    mesaiUnits,
    mesaiPay,
    basePay,
    gross,
    totalAdvance,
    totalDeduct,
    totalMinimum,
    net,
  };
}

export type MesaiCalendarDay = {
  date: string;
  day: number;
  inMonth: boolean;
  mesaiPay: number;
  mesaiType: MesaiType | string | null;
  approvalStatus: ReturnType<typeof getWorkLogApprovalStatus> | null;
  isToday?: boolean;
};

export type CalendarDay = {
  date: string;
  day: number;
  inMonth: boolean;
  workAmount: number;
  approved: boolean | null;
  approvalStatus: ReturnType<typeof getWorkLogApprovalStatus> | null;
  isToday?: boolean;
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
      workAmount: log ? workDayUnitsForLog(log) : 0,
      approved: log ? log.approved === true : null,
      approvalStatus: log ? getWorkLogApprovalStatus(log) : null,
      isToday: date === dayjs().format('YYYY-MM-DD'),
    });
  }

  return cells;
}

export function buildMesaiCalendar(
  month: string,
  workLogs: WorkLog[],
  dailyWage: number
): MesaiCalendarDay[] {
  const start = dayjs(`${month}-01`);
  const daysInMonth = start.daysInMonth();
  const firstDow = start.day();
  const mondayFirstOffset = (firstDow + 6) % 7;
  const cells: MesaiCalendarDay[] = [];

  for (let i = 0; i < mondayFirstOffset; i++) {
    cells.push({
      date: '',
      day: 0,
      inMonth: false,
      mesaiPay: 0,
      mesaiType: null,
      approvalStatus: null,
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = start.date(d).format('YYYY-MM-DD');
    const log = workLogs.find((w) => w.date === date && hasMesai(w));
    cells.push({
      date,
      day: d,
      inMonth: true,
      mesaiPay: log ? mesaiPayForLog(log, dailyWage) : 0,
      mesaiType: log?.mesai_type ?? null,
      approvalStatus: log ? getWorkLogApprovalStatus(log) : null,
      isToday: date === dayjs().format('YYYY-MM-DD'),
    });
  }

  return cells;
}

export function currentMonth() {
  return dayjs().format('YYYY-MM');
}
