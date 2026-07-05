import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  getCurrentOpenWorkDate,
  loadProjectAttendanceSchedule,
  scheduleFromProjectRow,
} from '@/lib/attendance-window';
import { notifyAttendanceReminder } from '@/lib/personnel-notification-service';
import { getPersonnelAttendanceStatus } from '@/lib/attendance-qr-service';

dayjs.extend(utc);
dayjs.extend(timezone);

export async function runAttendanceReminderCron(admin: SupabaseClient) {
  const { data: employees, error } = await admin
    .from('employees')
    .select('id, project_id, is_active, projects(timezone, work_start_time, work_end_time)')
    .eq('is_active', true);

  if (error) throw new Error(error.message);

  let sent = 0;

  for (const emp of employees ?? []) {
    const project = emp.projects as {
      timezone?: string | null;
      work_start_time?: string | null;
      work_end_time?: string | null;
    } | null;

    if (!project) continue;

    const schedule = scheduleFromProjectRow(project);
    const workDate = getCurrentOpenWorkDate(schedule);
    if (!workDate) continue;

    try {
      const status = await getPersonnelAttendanceStatus(admin, {
        employeeId: emp.id as string,
        projectId: emp.project_id as string,
        workDate,
        locale: 'tr',
      });

      if (status.state !== 'none' && status.state !== 'waiting') continue;

      const row = await notifyAttendanceReminder(admin, {
        employeeId: emp.id as string,
        projectId: emp.project_id as string,
        workDate,
      });

      if (row) sent += 1;
    } catch {
      /* tek personel hatası cron'u durdurmasın */
    }
  }

  return { sent, checked: employees?.length ?? 0 };
}

/** Proje bazlı hatırlatma — pencere açıldığında cron tarafından çağrılır */
export async function shouldRemindEmployee(
  admin: SupabaseClient,
  employeeId: string,
  projectId: string
) {
  const schedule = await loadProjectAttendanceSchedule(admin, projectId);
  const workDate = getCurrentOpenWorkDate(schedule);
  if (!workDate) return null;

  const status = await getPersonnelAttendanceStatus(admin, {
    employeeId,
    projectId,
    workDate,
    locale: 'tr',
  });

  if (status.state !== 'none' && status.state !== 'waiting') return null;
  return workDate;
}
