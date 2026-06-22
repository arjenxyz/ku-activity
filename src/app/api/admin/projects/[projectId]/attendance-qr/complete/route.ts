import { NextResponse } from 'next/server';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import { createAdminClient } from '@/utils/supabase/admin';
import {
  buildAttendanceQrUrl,
  completeAttendanceSession,
  getActiveAttendanceQr,
  listSessionCheckIns,
} from '@/lib/attendance-qr-service';
import {
  getAttendanceWindowStatus,
  getCurrentOpenWorkDate,
  getProjectCalendarDate,
  loadProjectAttendanceSchedule,
} from '@/lib/attendance-window';
import { apiErrorMessage } from '@/lib/project-queries';

type Ctx = { params: Promise<{ projectId: string }> };

export async function POST(request: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params;
    const user = await requireAdminProjectAccess(projectId);
    const body = await request.json().catch(() => ({}));
    const admin = createAdminClient();
    const schedule = await loadProjectAttendanceSchedule(admin, projectId);
    const workDate =
      (typeof body.date === 'string' ? body.date.slice(0, 10) : null) ??
      getCurrentOpenWorkDate(schedule) ??
      getProjectCalendarDate(schedule);

    const { count, session } = await completeAttendanceSession(admin, {
      projectId,
      workDate,
      completedBy: user.id,
    });

    const checkIns = await listSessionCheckIns(admin, session.id);
    const qr = await getActiveAttendanceQr(admin, projectId, workDate);
    const origin = new URL(request.url).origin;
    const calendarToday = getProjectCalendarDate(schedule);
    const window = getAttendanceWindowStatus(workDate, schedule);

    return NextResponse.json({
      session,
      qr: qr
        ? { ...qr, url: buildAttendanceQrUrl(qr.token, origin) }
        : null,
      checkIns,
      count,
      message: `${count} personel için tam gün yevmiye kaydedildi.`,
      isToday: workDate === calendarToday,
      canStart: window.isOpen,
      window,
    });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
