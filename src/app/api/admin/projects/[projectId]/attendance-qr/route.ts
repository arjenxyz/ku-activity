import { NextResponse } from 'next/server';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import { createAdminClient } from '@/utils/supabase/admin';
import {
  buildAttendanceQrUrl,
  cancelAttendanceSession,
  getActiveAttendanceQr,
  getProjectAttendanceWindowStatus,
  getSessionForDate,
  listSessionCheckIns,
  startAttendanceSession,
} from '@/lib/attendance-qr-service';
import {
  getAttendanceWindowStatus,
  getCurrentOpenWorkDate,
  getProjectCalendarDate,
  loadProjectAttendanceSchedule,
} from '@/lib/attendance-window';
import { apiErrorMessage } from '@/lib/project-queries';
import strings from '@json/src/app/api/admin/projects/[projectId]/attendance-qr/route.json';

type Ctx = { params: Promise<{ projectId: string }> };

function serializeQr(
  qr: {
    id: string;
    project_id: string;
    work_date: string;
    token: string;
    created_at: string;
  },
  origin: string
) {
  return { ...qr, url: buildAttendanceQrUrl(qr.token, origin) };
}

export async function GET(request: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params;
    await requireAdminProjectAccess(projectId);
    const { searchParams } = new URL(request.url);

    const admin = createAdminClient();
    const schedule = await loadProjectAttendanceSchedule(admin, projectId);
    const openWorkDate = getCurrentOpenWorkDate(schedule);
    const workDate =
      searchParams.get('date')?.slice(0, 10) ??
      openWorkDate ??
      getProjectCalendarDate(schedule);
    const calendarToday = getProjectCalendarDate(schedule);

    const session = await getSessionForDate(admin, projectId, workDate);
    const qr =
      session?.status === 'active'
        ? await getActiveAttendanceQr(admin, projectId, workDate)
        : null;
    const checkIns = session ? await listSessionCheckIns(admin, session.id) : [];
    const origin = new URL(request.url).origin;
    const window = getAttendanceWindowStatus(workDate, schedule);

    return NextResponse.json({
      session,
      qr: qr ? serializeQr(qr, origin) : null,
      checkIns,
      isToday: workDate === calendarToday,
      canStart:
        (!session || session.status === 'completed' || session.status === 'cancelled') &&
        window.isOpen,
      window,
    });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}

/** Yoklama oturumunu başlat */
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

    const { session, qr } = await startAttendanceSession(admin, {
      projectId,
      workDate,
      startedBy: user.id,
    });
    const checkIns = await listSessionCheckIns(admin, session.id);
    const origin = new URL(request.url).origin;
    const calendarToday = getProjectCalendarDate(schedule);
    const window = await getProjectAttendanceWindowStatus(admin, projectId, workDate);

    return NextResponse.json({
      session,
      qr: serializeQr(qr, origin),
      checkIns,
      isToday: workDate === calendarToday,
      canStart: false,
      window,
    });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}

/** Aktif yoklamayı iptal et */
export async function DELETE(request: Request, ctx: Ctx) {
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

    await cancelAttendanceSession(admin, {
      projectId,
      workDate,
      cancelledBy: user.id,
    });

    const calendarToday = getProjectCalendarDate(schedule);
    const window = getAttendanceWindowStatus(workDate, schedule);

    return NextResponse.json({
      session: null,
      qr: null,
      checkIns: [],
      isToday: workDate === calendarToday,
      canStart: window.isOpen,
      window,
      message: strings.yoklamaIptalEdildi,
    });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
