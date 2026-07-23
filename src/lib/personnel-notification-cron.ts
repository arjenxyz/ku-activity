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

/**
 * Yoklama hatırlatması yalnızca:
 * - İş saati bittikten sonra (yoklama penceresi açıkken)
 * - O gün yoklama listesinde olmayan (`none`)
 * - O gün için henüz yevmiye kaydı olmayan
 * kişilere gider. Listede bekleyen (`waiting`) veya onaylı/kayıtlı olanlar hariç.
 */
export async function isEligibleForAttendanceReminder(
  admin: SupabaseClient,
  params: { employeeId: string; projectId: string; workDate: string }
): Promise<boolean> {
  const status = await getPersonnelAttendanceStatus(admin, {
    employeeId: params.employeeId,
    projectId: params.projectId,
    workDate: params.workDate,
    locale: 'tr',
  });

  // Listede olan, tamamlanan, gelmedi, çıkarılmış vb. → hatırlatma yok
  if (status.state !== 'none') return false;

  const { data: workLog, error } = await admin
    .from('work_logs')
    .select('id')
    .eq('employee_id', params.employeeId)
    .eq('date', params.workDate)
    .maybeSingle();

  if (error) throw new Error(error.message);
  // Manuel veya onaylı yevmiye varsa yoklama hatırlatmasına gerek yok
  if (workLog) return false;

  return true;
}

export async function runAttendanceReminderCron(admin: SupabaseClient) {
  const { data: employees, error } = await admin
    .from('employees')
    .select('id, project_id, is_active, projects(timezone, work_start_time, work_end_time)')
    .eq('is_active', true);

  if (error) throw new Error(error.message);

  let sent = 0;
  let skipped = 0;

  for (const emp of employees ?? []) {
    const project = emp.projects as {
      timezone?: string | null;
      work_start_time?: string | null;
      work_end_time?: string | null;
    } | null;

    if (!project) continue;

    // İş saatleri içinde (mesai bitmeden) hatırlatma yok — pencere mesai bitişinden sonra açılır
    const schedule = scheduleFromProjectRow(project);
    const workDate = getCurrentOpenWorkDate(schedule);
    if (!workDate) continue;

    try {
      const eligible = await isEligibleForAttendanceReminder(admin, {
        employeeId: emp.id as string,
        projectId: emp.project_id as string,
        workDate,
      });

      if (!eligible) {
        skipped += 1;
        continue;
      }

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

  return { sent, skipped, checked: employees?.length ?? 0 };
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

  const eligible = await isEligibleForAttendanceReminder(admin, {
    employeeId,
    projectId,
    workDate,
  });

  return eligible ? workDate : null;
}
