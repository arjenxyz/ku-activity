import dayjs from 'dayjs';
import type { Deduction, MinimumWage, WorkLog } from '@/lib/personnel-stats';
import type { PersonnelNotificationItem } from '@/hooks/usePersonnelNotifications';
import { DEMO_PROJECT_ID } from '@/lib/demo/demo-paths';

const TODAY = dayjs().format('YYYY-MM-DD');
const MONTH = dayjs().format('YYYY-MM');

function daysInMonth(month: string) {
  const start = dayjs(`${month}-01`);
  const days = start.daysInMonth();
  const out: string[] = [];
  for (let d = 1; d <= days; d++) {
    const date = start.date(d);
    if (date.day() === 0 || date.day() === 6) continue;
    if (date.isAfter(dayjs(), 'day')) continue;
    out.push(date.format('YYYY-MM-DD'));
  }
  return out;
}

export const DEMO_EMPLOYEE = {
  id: 'demo-employee-1',
  name: 'Arjen',
  first_name: 'Arjen',
  last_name: '',
  email: 'arjen@demo.crewledger.app',
  phone: '0532 000 00 00',
  daily_wage: 2500,
  position: 'Usta',
  hire_date: '2025-03-01',
  photo_url: null as string | null,
  tc_kimlik: '***********34',
  birth_date: '1992-05-14',
  iban_masked: 'TR** **** **** **** **** **12',
  project_id: DEMO_PROJECT_ID,
  project_name: 'Demo İnşaat Projesi',
  project: {
    id: DEMO_PROJECT_ID,
    name: 'Demo İnşaat Projesi',
    status: 'active',
    description: 'Örnek proje — giriş gerektirmez',
    location: 'İstanbul',
    code: 'DEMO-01',
    workStartTime: '08:00',
    workEndTime: '17:00',
  },
  manager: {
    name: 'Mehmet Demir',
    phone: '0533 111 22 33',
  },
};

export function getDemoWorkLogs(month: string = MONTH): WorkLog[] {
  return daysInMonth(month).map((date, i) => ({
    id: `demo-wl-${date}`,
    date,
    amount: i % 7 === 3 ? 0.5 : 1,
    mesai_type: i % 5 === 0 ? 'yarim' : null,
    mesai_units: i % 5 === 0 ? 0.5 : 0,
    description: null,
    approved: true,
    admin_confirmed_at: `${date}T10:00:00.000Z`,
    employee_confirmed_at: `${date}T18:00:00.000Z`,
    created_at: `${date}T09:00:00.000Z`,
  }));
}

export function getDemoAbsenceDates(month: string = MONTH): string[] {
  const start = dayjs(`${month}-01`);
  const candidate = start.date(12);
  if (candidate.month() !== start.month()) return [];
  return [candidate.format('YYYY-MM-DD')];
}

export function getDemoDeductions(month: string = MONTH): Deduction[] {
  return [
    {
      id: 'demo-ded-1',
      date: `${month}-05`,
      type: 'advance',
      amount: 3000,
      description: 'Nakit avans',
      created_at: `${month}-05T12:00:00.000Z`,
    },
    {
      id: 'demo-ded-2',
      date: `${month}-18`,
      type: 'deduction',
      amount: 250,
      description: 'Malzeme kesintisi',
      created_at: `${month}-18T12:00:00.000Z`,
    },
  ];
}

export function getDemoMinimumWages(): MinimumWage[] {
  return [];
}

export function getDemoMonthStats(month: string = MONTH) {
  const logs = getDemoWorkLogs(month);
  const workDays = logs.reduce((s, l) => s + l.amount, 0);
  const mesaiUnits = logs.reduce((s, l) => s + (l.mesai_units ?? 0), 0);
  const daily = DEMO_EMPLOYEE.daily_wage;
  const basePay = Math.round(workDays * daily);
  const mesaiPay = Math.round(mesaiUnits * daily);
  const deductions = getDemoDeductions(month);
  const totalAdvances = deductions.filter((d) => d.type === 'advance').reduce((s, d) => s + d.amount, 0);
  const totalDeductions = deductions.filter((d) => d.type !== 'advance').reduce((s, d) => s + d.amount, 0);
  const gross = basePay + mesaiPay;
  return {
    month,
    work_days: workDays,
    approved_days: workDays,
    pending_days: 0,
    mesai_units: mesaiUnits,
    mesai_pay: mesaiPay,
    base_pay: basePay,
    gross_pay: gross,
    total_advances: totalAdvances,
    total_deductions: totalDeductions,
    total_minimum: 0,
    net_pay: gross - totalAdvances - totalDeductions,
  };
}

export function getDemoTodayAttendance() {
  return {
    date: TODAY,
    status: 'confirmed' as const,
    workLog: { amount: 1, mesai_type: 'none' },
    project: {
      name: DEMO_EMPLOYEE.project.name,
      workStartTime: DEMO_EMPLOYEE.project.workStartTime,
      workEndTime: DEMO_EMPLOYEE.project.workEndTime,
    },
  };
}

export function getDemoAttendanceStatus() {
  return {
    workDate: TODAY,
    state: 'waiting' as const,
    listedAt: null as string | null,
    completedAt: null as string | null,
    message: 'Bugünkü yoklama için QR kodunuzu okutmanız bekleniyor.',
    messageCode: 'attendance_waiting',
    window: {
      workDate: TODAY,
      timezone: 'Europe/Istanbul',
      workStartTime: '08:00',
      workEndTime: '17:00',
      windowStart: `${TODAY}T05:00:00.000Z`,
      windowEnd: `${TODAY}T20:00:00.000Z`,
      windowStartLabel: '08:00',
      windowEndLabel: '17:00',
      isOpen: true,
      currentOpenWorkDate: TODAY,
      message: 'Yoklama penceresi açık',
    },
  };
}

export function getDemoDayReports() {
  return [] as Array<{
    id: string;
    work_date: string;
    categories: string[];
    note: string;
    status: 'open' | 'resolved';
    created_at: string;
    resolved_at?: string | null;
  }>;
}

export type DemoAdvanceRequest = {
  id: string;
  requested_amount: number;
  approved_amount: number | null;
  employee_note: string | null;
  admin_note: string | null;
  status: 'pending' | 'approved' | 'awaiting_receipt' | 'paid' | 'rejected' | 'cancelled' | 'expired';
  payment_method: 'bank_transfer' | 'cash' | null;
  requested_at: string;
  approved_at: string | null;
  paid_at: string | null;
  rejection_reason: string | null;
  payment_details: null;
};

export function getDemoAdvanceRequests(): DemoAdvanceRequest[] {
  return [
    {
      id: 'demo-adv-1',
      requested_amount: 3000,
      approved_amount: 3000,
      employee_note: 'Acil avans',
      admin_note: null,
      status: 'paid',
      payment_method: 'cash',
      requested_at: dayjs().subtract(10, 'day').toISOString(),
      approved_at: dayjs().subtract(9, 'day').toISOString(),
      paid_at: dayjs().subtract(9, 'day').toISOString(),
      rejection_reason: null,
      payment_details: null,
    },
    {
      id: 'demo-adv-2',
      requested_amount: 1500,
      approved_amount: null,
      employee_note: 'Demo bekleyen talep',
      admin_note: null,
      status: 'pending',
      payment_method: null,
      requested_at: dayjs().subtract(1, 'day').toISOString(),
      approved_at: null,
      paid_at: null,
      rejection_reason: null,
      payment_details: null,
    },
  ];
}

export function getDemoNotifications(): PersonnelNotificationItem[] {
  return [
    {
      id: 'demo-n1',
      type: 'attendance_reminder',
      title: 'Yoklama hatırlatması',
      body: 'Bugünkü yoklama için QR kodunuzu okutmanız bekleniyor.',
      href: '/personnel-panel/demo/yoklama',
      data: { workDate: TODAY },
      read_at: null,
      created_at: dayjs().subtract(2, 'hour').toISOString(),
    },
    {
      id: 'demo-n2',
      type: 'work_log_recorded',
      title: 'Yevmiye kaydı',
      body: `${dayjs().subtract(1, 'day').format('YYYY-MM-DD')} için 1 gün yevmiye kaydınız Mehmet Demir tarafından oluşturuldu.`,
      href: '/personnel-panel/demo?tab=work',
      data: {
        workDate: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
        amount: 1,
        actorName: 'Mehmet Demir',
      },
      read_at: dayjs().subtract(1, 'hour').toISOString(),
      created_at: dayjs().subtract(1, 'day').toISOString(),
    },
    {
      id: 'demo-n3',
      type: 'deduction_added',
      title: 'Bordro kaydı',
      body: '250 TL kesinti işlemi Mehmet Demir tarafından bordronuza yansıtılmıştır.',
      href: '/personnel-panel/demo?tab=finance',
      data: { amount: 250, type: 'deduction', actorName: 'Mehmet Demir' },
      read_at: null,
      created_at: dayjs().subtract(3, 'day').toISOString(),
    },
  ];
}
