import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import type { SupabaseClient } from '@supabase/supabase-js';
import { listDayAbsenceEmployeeIds } from '@/lib/attendance-day-absence';
import {
  completeAttendanceSession,
  getActiveSession,
  getSessionForDate,
  listSessionCheckIns,
  startAttendanceSession,
} from '@/lib/attendance-qr-service';
import {
  DEFAULT_PROJECT_TIMEZONE,
  getProjectCalendarDate,
  scheduleFromProjectRow,
} from '@/lib/attendance-window';

dayjs.extend(utc);
dayjs.extend(timezone);

/** Proje saat diliminde 21:00–21:59 arası otomatik yoklama çalışır */
const AUTO_HOUR = 21;

async function ensureCheckIn(
  admin: SupabaseClient,
  sessionId: string,
  employeeId: string,
  workDate: string,
  didNotWork: boolean
) {
  const { data: existing } = await admin
    .from('attendance_session_checkins')
    .select('id, did_not_work, work_log_id')
    .eq('session_id', sessionId)
    .eq('employee_id', employeeId)
    .maybeSingle();

  if (existing) {
    if (didNotWork && !existing.did_not_work) {
      if (existing.work_log_id) {
        await admin.from('work_logs').delete().eq('id', existing.work_log_id);
      }
      // Orphan work_log (manuel) varsa da temizle
      await admin
        .from('work_logs')
        .delete()
        .eq('employee_id', employeeId)
        .eq('date', workDate);
      await admin
        .from('attendance_session_checkins')
        .update({
          did_not_work: true,
          work_log_id: null,
          planned_amount: 1,
          planned_mesai_type: 'none',
        })
        .eq('id', existing.id);
    }
    return;
  }

  if (didNotWork) {
    await admin
      .from('work_logs')
      .delete()
      .eq('employee_id', employeeId)
      .eq('date', workDate);
  }

  await admin.from('attendance_session_checkins').insert({
    session_id: sessionId,
    employee_id: employeeId,
    did_not_work: didNotWork,
    planned_amount: 1,
    planned_mesai_type: 'none',
  });
}

async function runAutoAttendanceForProject(
  admin: SupabaseClient,
  project: {
    id: string;
    timezone?: string | null;
    work_start_time?: string | null;
    work_end_time?: string | null;
  }
): Promise<{ projectId: string; workDate: string; status: string; count: number }> {
  const schedule = scheduleFromProjectRow(project);
  const now = dayjs().tz(schedule.timezone);
  const workDate = getProjectCalendarDate(schedule);

  if (now.hour() !== AUTO_HOUR) {
    return { projectId: project.id, workDate, status: 'skipped_hour', count: 0 };
  }

  const existing = await getSessionForDate(admin, project.id, workDate);
  // Sadece tamamlanmış gün kilitli. İptal edilmiş QR → otomatik hâlâ çalışabilir.
  if (existing?.status === 'completed') {
    return { projectId: project.id, workDate, status: 'already_done', count: 0 };
  }

  // QR oturumu açıksa: listedekileri bitir (yeni isim uydurma) — gün kilitlenir
  if (existing?.status === 'active' && existing.source !== 'auto') {
    const result = await completeAttendanceSession(admin, {
      projectId: project.id,
      workDate,
      skipWindowCheck: true,
    });
    return {
      projectId: project.id,
      workDate,
      status: 'completed_stuck_manual',
      count: result.count,
    };
  }

  const { data: employees, error: empError } = await admin
    .from('employees')
    .select('id')
    .eq('project_id', project.id)
    .eq('is_active', true);

  if (empError) throw new Error(empError.message);

  const absences = await listDayAbsenceEmployeeIds(admin, project.id, workDate);
  const employeeIds = (employees ?? []).map((e) => e.id as string);

  let session = await getActiveSession(admin, project.id, workDate);
  if (!session) {
    const started = await startAttendanceSession(admin, {
      projectId: project.id,
      workDate,
      source: 'auto',
    });
    session = started.session;
  }

  for (const employeeId of employeeIds) {
    await ensureCheckIn(admin, session.id, employeeId, workDate, absences.has(employeeId));
  }

  // Listedeki ama absences'ta olanları da işaretle
  const checkIns = await listSessionCheckIns(admin, session.id);
  for (const checkIn of checkIns) {
    if (absences.has(checkIn.employee_id) && !checkIn.did_not_work) {
      await ensureCheckIn(admin, session.id, checkIn.employee_id, workDate, true);
    }
  }

  const result = await completeAttendanceSession(admin, {
    projectId: project.id,
    workDate,
    skipWindowCheck: true,
  });

  return {
    projectId: project.id,
    workDate,
    status: 'completed',
    count: result.count,
  };
}

export async function runAutoAttendanceCron(admin: SupabaseClient) {
  const { data: projects, error } = await admin
    .from('projects')
    .select('id, timezone, work_start_time, work_end_time, status, auto_attendance_enabled')
    .eq('auto_attendance_enabled', true)
    .eq('status', 'active');

  if (error) {
    if (error.message.includes('auto_attendance_enabled')) {
      return { processed: 0, results: [] as Awaited<ReturnType<typeof runAutoAttendanceForProject>>[] };
    }
    throw new Error(error.message);
  }

  const results: Awaited<ReturnType<typeof runAutoAttendanceForProject>>[] = [];

  for (const project of projects ?? []) {
    try {
      const tz = (project.timezone as string | null)?.trim() || DEFAULT_PROJECT_TIMEZONE;
      // Sadece TR (veya proje TZ) 21:00 penceresinde çalış
      if (dayjs().tz(tz).hour() !== AUTO_HOUR) {
        results.push({
          projectId: project.id as string,
          workDate: getProjectCalendarDate(scheduleFromProjectRow(project)),
          status: 'skipped_hour',
          count: 0,
        });
        continue;
      }

      const result = await runAutoAttendanceForProject(admin, {
        id: project.id as string,
        timezone: project.timezone as string | null,
        work_start_time: project.work_start_time as string | null,
        work_end_time: project.work_end_time as string | null,
      });
      results.push(result);
    } catch (e) {
      results.push({
        projectId: project.id as string,
        workDate: '',
        status: e instanceof Error ? `error:${e.message}` : 'error',
        count: 0,
      });
    }
  }

  return {
    processed: results.filter((r) => r.status === 'completed').length,
    results,
  };
}
