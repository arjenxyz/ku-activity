import type { SupabaseClient } from '@supabase/supabase-js';
import {
  ATTENDANCE_MESSAGE_CODES,
  type AttendanceMessageCode,
} from '@/lib/i18n/attendance-messages';
import { notifyAttendanceNotice } from '@/lib/personnel-notification-service';

export type AttendanceNoticeType = 'removed_from_list' | 'session_cancelled' | 'did_not_work';

export async function recordAttendanceNotice(
  admin: SupabaseClient,
  params: {
    employeeId: string;
    projectId: string;
    workDate: string;
    noticeType: AttendanceNoticeType;
    actorName?: string;
  }
): Promise<void> {
  const { error } = await admin.from('attendance_employee_notices').insert({
    employee_id: params.employeeId,
    project_id: params.projectId,
    work_date: params.workDate.slice(0, 10),
    notice_type: params.noticeType,
  });

  if (error && !error.message.includes('attendance_employee_notices')) {
    throw new Error(error.message);
  }

  try {
    await notifyAttendanceNotice(admin, {
      employeeId: params.employeeId,
      projectId: params.projectId,
      workDate: params.workDate,
      noticeType: params.noticeType,
      actorName: params.actorName,
    });
  } catch {
    /* bildirim isteğe bağlı */
  }
}

export async function clearAttendanceNotices(
  admin: SupabaseClient,
  params: { employeeId: string; projectId: string; workDate: string }
): Promise<void> {
  const { error } = await admin
    .from('attendance_employee_notices')
    .delete()
    .eq('employee_id', params.employeeId)
    .eq('project_id', params.projectId)
    .eq('work_date', params.workDate.slice(0, 10));

  if (error && !error.message.includes('attendance_employee_notices')) {
    throw new Error(error.message);
  }
}

export async function getLatestAttendanceNotice(
  admin: SupabaseClient,
  params: { employeeId: string; projectId: string; workDate: string }
): Promise<{ notice_type: AttendanceNoticeType; created_at: string } | null> {
  const { data, error } = await admin
    .from('attendance_employee_notices')
    .select('notice_type, created_at')
    .eq('employee_id', params.employeeId)
    .eq('project_id', params.projectId)
    .eq('work_date', params.workDate.slice(0, 10))
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (error.message.includes('attendance_employee_notices')) return null;
    throw new Error(error.message);
  }

  if (!data) return null;
  return {
    notice_type: data.notice_type as AttendanceNoticeType,
    created_at: data.created_at as string,
  };
}

export function noticeToMessageCode(noticeType: AttendanceNoticeType): AttendanceMessageCode {
  if (noticeType === 'session_cancelled') return ATTENDANCE_MESSAGE_CODES.SESSION_CANCELLED;
  if (noticeType === 'did_not_work') return ATTENDANCE_MESSAGE_CODES.DID_NOT_WORK;
  return ATTENDANCE_MESSAGE_CODES.REMOVED_FROM_LIST;
}
