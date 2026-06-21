import { NextResponse } from 'next/server';
import dayjs from 'dayjs';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import { createAdminClient } from '@/utils/supabase/admin';
import {
  buildAttendanceQrUrl,
  getActiveAttendanceQr,
  getSessionForDate,
  listSessionCheckIns,
  startAttendanceSession,
} from '@/lib/attendance-qr-service';
import { apiErrorMessage } from '@/lib/project-queries';

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
    const workDate =
      searchParams.get('date')?.slice(0, 10) ?? dayjs().format('YYYY-MM-DD');
    const today = dayjs().format('YYYY-MM-DD');

    const admin = createAdminClient();
    const session = await getSessionForDate(admin, projectId, workDate);
    const qr =
      session?.status === 'active'
        ? await getActiveAttendanceQr(admin, projectId, workDate)
        : null;
    const checkIns = session ? await listSessionCheckIns(admin, session.id) : [];
    const origin = new URL(request.url).origin;

    return NextResponse.json({
      session,
      qr: qr ? serializeQr(qr, origin) : null,
      checkIns,
      isToday: workDate === today,
      canStart: !session || session.status === 'completed',
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
    const workDate =
      (typeof body.date === 'string' ? body.date.slice(0, 10) : null) ??
      dayjs().format('YYYY-MM-DD');

    const admin = createAdminClient();
    const { session, qr } = await startAttendanceSession(admin, {
      projectId,
      workDate,
      startedBy: user.id,
    });
    const checkIns = await listSessionCheckIns(admin, session.id);
    const origin = new URL(request.url).origin;
    const today = dayjs().format('YYYY-MM-DD');

    return NextResponse.json({
      session,
      qr: serializeQr(qr, origin),
      checkIns,
      isToday: workDate === today,
      canStart: false,
    });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
