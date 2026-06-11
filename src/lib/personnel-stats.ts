import dayjs from 'dayjs';

export type WorkLog = {
  id: string;
  date: string;
  amount: number;
  description: string | null;
  approved?: boolean;
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

export function workDayLabel(amount: number) {
  if (amount === 1) return 'Tam gün';
  if (amount === 0.5) return 'Yarım gün';
  return `${amount} gün`;
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

export function computePersonnelStats(
  workLogs: WorkLog[],
  deductions: Deduction[],
  dailyWage: number,
  minimumWages: MinimumWage[] = []
): PersonnelStats {
  const workDays = workLogs.reduce((s, w) => s + Number(w.amount), 0);
  const approvedDays = workLogs
    .filter((w) => w.approved !== false)
    .reduce((s, w) => s + Number(w.amount), 0);
  const pendingDays = workLogs
    .filter((w) => w.approved === false)
    .reduce((s, w) => s + Number(w.amount), 0);
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
};

export function buildMonthCalendar(month: string, workLogs: WorkLog[]): CalendarDay[] {
  const start = dayjs(`${month}-01`);
  const daysInMonth = start.daysInMonth();
  const firstDow = start.day(); // 0 Sun
  const mondayFirstOffset = (firstDow + 6) % 7;
  const cells: CalendarDay[] = [];

  for (let i = 0; i < mondayFirstOffset; i++) {
    cells.push({ date: '', day: 0, inMonth: false, workAmount: 0, approved: null });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = start.date(d).format('YYYY-MM-DD');
    const log = workLogs.find((w) => w.date === date);
    cells.push({
      date,
      day: d,
      inMonth: true,
      workAmount: log ? Number(log.amount) : 0,
      approved: log ? log.approved !== false : null,
    });
  }

  return cells;
}

export function currentMonth() {
  return dayjs().format('YYYY-MM');
}
