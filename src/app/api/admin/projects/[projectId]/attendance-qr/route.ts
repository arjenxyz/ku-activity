import { NextResponse } from 'next/server';
import dayjs from 'dayjs';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import { createAdminClient } from '@/utils/supabase/admin';
import {
  buildAttendanceQrUrl,
  createActiveAttendanceQr,
  getActiveAttendanceQr,
  getOrCreateTodayAttendanceQr,
  listAttendanceCheckInsForDate,
} from '@/lib/attendance-qr-service';
import { apiErrorMessage } from '@/lib/project-queries';

type Ctx = { params: Promise<{ projectId: string }> };

function serializeQr(qr: { id: string; project_id: string; work_date: string; token: string; created_at: string }, origin: string) {
  return {
    ...qr,
    url: buildAttendanceQrUrl(qr.token, origin),
  };
}

export async function GET(request: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params;
    const user = await requireAdminProjectAccess(projectId);
    const { searchParams } = new URL(request.url);
    const workDate =
      searchParams.get('date')?.slice(0, 10) ?? dayjs().format('YYYY-MM-DD');
    const today = dayjs().format('YYYY-MM-DD');
    const isToday = workDate === today;

    const admin = createAdminClient();
    let qr = await getActiveAttendanceQr(admin, projectId, workDate);

    if (!qr && isToday) {
      qr = await getOrCreateTodayAttendanceQr(admin, {
        projectId,
        workDate,
        createdBy: user.id,
      });
    }

    const checkIns = await listAttendanceCheckInsForDate(admin, projectId, workDate);
    const origin = new URL(request.url).origin;

    return NextResponse.json({
      qr: qr ? serializeQr(qr, origin) : null,
      checkIns,
      isToday,
      canCreateNew: !isToday || !qr,
    });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}

/** Geçmiş günler: sınırsız yeni QR. Bugün: yalnızca henüz QR yoksa. */
export async function POST(request: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params;
    const user = await requireAdminProjectAccess(projectId);
    const body = await request.json().catch(() => ({}));
    const workDate =
      (typeof body.date === 'string' ? body.date.slice(0, 10) : null) ??
      dayjs().format('YYYY-MM-DD');
    const today = dayjs().format('YYYY-MM-DD');
    const isToday = workDate === today;

    const admin = createAdminClient();

    if (isToday) {
      const existing = await getActiveAttendanceQr(admin, projectId, workDate);
      if (existing) {
        return NextResponse.json(
          {
            error:
              'Bugün için QR zaten oluşturuldu. Her personel okutunca QR ve kod otomatik yenilenir.',
          },
          { status: 400 }
        );
      }
    }

    const qr = await createActiveAttendanceQr(admin, {
      projectId,
      workDate,
      createdBy: user.id,
    });
    const checkIns = await listAttendanceCheckInsForDate(admin, projectId, workDate);
    const origin = new URL(request.url).origin;

    return NextResponse.json({
      qr: serializeQr(qr, origin),
      checkIns,
      isToday,
      canCreateNew: !isToday,
    });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
