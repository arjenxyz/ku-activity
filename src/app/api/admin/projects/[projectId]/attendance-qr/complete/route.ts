import { NextResponse } from 'next/server';
import dayjs from 'dayjs';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import { createAdminClient } from '@/utils/supabase/admin';
import {
  buildAttendanceQrUrl,
  completeAttendanceSession,
  getActiveAttendanceQr,
  listSessionCheckIns,
} from '@/lib/attendance-qr-service';
import { apiErrorMessage } from '@/lib/project-queries';

type Ctx = { params: Promise<{ projectId: string }> };

export async function POST(request: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params;
    const user = await requireAdminProjectAccess(projectId);
    const body = await request.json().catch(() => ({}));
    const workDate =
      (typeof body.date === 'string' ? body.date.slice(0, 10) : null) ??
      dayjs().format('YYYY-MM-DD');

    const admin = createAdminClient();
    const { count, session } = await completeAttendanceSession(admin, {
      projectId,
      workDate,
      completedBy: user.id,
    });

    const checkIns = await listSessionCheckIns(admin, session.id);
    const qr = await getActiveAttendanceQr(admin, projectId, workDate);
    const origin = new URL(request.url).origin;
    const today = dayjs().format('YYYY-MM-DD');

    return NextResponse.json({
      session,
      qr: qr
        ? { ...qr, url: buildAttendanceQrUrl(qr.token, origin) }
        : null,
      checkIns,
      count,
      message: `${count} personel için tam gün yevmiye kaydedildi.`,
      isToday: workDate === today,
      canStart: true,
    });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
