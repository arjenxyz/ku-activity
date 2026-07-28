import dayjs from 'dayjs';
import { DEMO_PROJECT_ID } from '@/lib/demo/demo-paths';
import type { Project } from '@/types/project';
import type { AdminProjectQuota } from '@/lib/project-admin-quota';

const TODAY = dayjs().format('YYYY-MM-DD');

export const DEMO_ADMIN_PROJECT: Project = {
  id: DEMO_PROJECT_ID,
  name: 'Demo İnşaat Projesi',
  code: 'DEMO-01',
  location: 'İstanbul',
  start_date: '2025-01-15',
  end_date: null,
  description: 'Örnek proje — giriş gerektirmez',
  status: 'active',
  created_by: 'demo-admin',
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: '2025-01-01T00:00:00.000Z',
  employee_count: 4,
  active_employee_count: 4,
  work_start_time: '08:00',
  work_end_time: '17:00',
  timezone: 'Europe/Istanbul',
  auto_attendance_enabled: true,
  membership: 'owner',
};

export const DEMO_ADMIN_QUOTA: AdminProjectQuota = {
  operationalCount: 1,
  limit: 2,
  canCreate: false,
};

export const DEMO_ADMIN_EMPLOYEES = [
  {
    id: 'demo-employee-1',
    name: 'Ali Yılmaz',
    email: 'ali.yilmaz@demo.crewledger.app',
    phone: '0532 000 00 00',
    position: 'Usta',
    daily_wage: 2500,
    is_active: true,
    hire_date: '2025-03-01',
    project_id: DEMO_PROJECT_ID,
    photo_url: null,
  },
  {
    id: 'demo-employee-2',
    name: 'Ayşe Kaya',
    email: 'ayse.kaya@demo.crewledger.app',
    phone: '0532 111 11 11',
    position: 'Kalfa',
    daily_wage: 2200,
    is_active: true,
    hire_date: '2025-04-10',
    project_id: DEMO_PROJECT_ID,
    photo_url: null,
  },
  {
    id: 'demo-employee-3',
    name: 'Can Demir',
    email: 'can.demir@demo.crewledger.app',
    phone: '0532 222 22 22',
    position: 'İşçi',
    daily_wage: 1800,
    is_active: true,
    hire_date: '2025-05-01',
    project_id: DEMO_PROJECT_ID,
    photo_url: null,
  },
  {
    id: 'demo-employee-4',
    name: 'Elif Şahin',
    email: 'elif.sahin@demo.crewledger.app',
    phone: '0532 333 33 33',
    position: 'İşçi',
    daily_wage: 1800,
    is_active: true,
    hire_date: '2025-06-12',
    project_id: DEMO_PROJECT_ID,
    photo_url: null,
  },
];

export function getDemoAdminProjects(): Project[] {
  return [DEMO_ADMIN_PROJECT];
}

export function getDemoAdminSummary(projectId: string = DEMO_PROJECT_ID) {
  return {
    summary: {
      project_id: projectId,
      total_work_pay: 186000,
      total_work_days: 78,
      total_advances: 12000,
      total_deductions: 850,
      total_minimum: 0,
      employee_count: DEMO_ADMIN_EMPLOYEES.length,
      active_employee_count: DEMO_ADMIN_EMPLOYEES.length,
    },
  };
}

export function getDemoAdminWorkLogs(month: string) {
  const start = dayjs(`${month}-01`);
  const records: Array<{
    id: string;
    employee_id: string;
    date: string;
    amount: number;
    mesai_units: number;
    approved: boolean;
    admin_confirmed_at: string;
    employee_confirmed_at: string;
    employee_disputed_at: null;
  }> = [];

  for (const emp of DEMO_ADMIN_EMPLOYEES) {
    for (let d = 1; d <= start.daysInMonth(); d++) {
      const date = start.date(d);
      if (date.day() === 0 || date.day() === 6) continue;
      if (date.isAfter(dayjs(), 'day')) continue;
      const iso = date.format('YYYY-MM-DD');
      records.push({
        id: `demo-wl-${emp.id}-${iso}`,
        employee_id: emp.id,
        date: iso,
        amount: 1,
        mesai_units: 0,
        approved: true,
        admin_confirmed_at: `${iso}T10:00:00.000Z`,
        employee_confirmed_at: `${iso}T18:00:00.000Z`,
        employee_disputed_at: null,
      });
    }
  }

  return { records };
}

export function getDemoAttendanceQr() {
  return {
    session: {
      id: 'demo-session-1',
      project_id: DEMO_PROJECT_ID,
      work_date: TODAY,
      status: 'active' as const,
      source: 'manual' as const,
      started_at: `${TODAY}T05:00:00.000Z`,
      completed_at: null,
    },
    qr: {
      id: 'demo-qr-1',
      project_id: DEMO_PROJECT_ID,
      work_date: TODAY,
      token: 'demo-qr-token',
      url: 'https://crewledger.app/demo-qr',
      created_at: `${TODAY}T05:00:00.000Z`,
    },
    checkIns: DEMO_ADMIN_EMPLOYEES.slice(0, 2).map((e) => ({
      id: `demo-checkin-${e.id}`,
      employee_id: e.id,
      employee_name: e.name,
      work_log_id: null,
      created_at: `${TODAY}T06:30:00.000Z`,
      yevmiye_kayitli: false,
      planned_amount: 1,
      planned_mesai_type: 'none' as const,
      planned_description: null,
    })),
    isToday: true,
    canStart: false,
    count: 2,
    autoAttendanceEnabled: true,
  };
}
