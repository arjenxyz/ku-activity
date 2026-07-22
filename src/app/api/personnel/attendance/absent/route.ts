import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { requirePersonnelSession } from '@/lib/personnel-auth';
import {
  clearDayAbsence,
  hasDayAbsence,
  reportDayAbsence,
} from '@/lib/attendance-day-absence';
import { getPersonnelAttendanceStatus } from '@/lib/attendance-qr-service';
import {
  getCurrentOpenWorkDate,
  getProjectCalendarDate,
  loadProjectAttendanceSchedule,
} from '@/lib/attendance-window';

async function resolveWorkDate(projectId: string, dateParam?: string | null) {
  const admin = createAdminClient();
  const schedule = await loadProjectAttendanceSchedule(admin, projectId);
  return (
    dateParam?.slice(0, 10) ??
    getCurrentOpenWorkDate(schedule) ??
    getProjectCalendarDate(schedule)
  );
}

/** Bugün işe çıkmadım bildir */
export async function POST(request: Request) {
  try {
    const session = await requirePersonnelSession();
    const body = await request.json().catch(() => ({}));
    const admin = createAdminClient();
    const workDate = await resolveWorkDate(
      session.projectId,
      typeof body.date === 'string' ? body.date : null
    );

    const status = await getPersonnelAttendanceStatus(admin, {
      employeeId: session.employeeId,
      projectId: session.projectId,
      workDate,
    });

    if (status.state === 'completed') {
      return NextResponse.json(
        { error: 'Yoklama tamamlandı — artık bildirim yapılamaz' },
        { status: 409 }
      );
    }

    if (status.state === 'waiting') {
      return NextResponse.json(
        { error: 'Zaten yoklama listesindesiniz. Yöneticiniz listeden çıkarabilir.' },
        { status: 409 }
      );
    }

    await reportDayAbsence(admin, {
      employeeId: session.employeeId,
      projectId: session.projectId,
      workDate,
    });

    return NextResponse.json({ ok: true, workDate, didNotWork: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Kayıt başarısız';
    const status = message === 'UNAUTHORIZED' ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

/** İşe çıkmama bildirimini geri al */
export async function DELETE(request: Request) {
  try {
    const session = await requirePersonnelSession();
    const { searchParams } = new URL(request.url);
    const admin = createAdminClient();
    const workDate = await resolveWorkDate(session.projectId, searchParams.get('date'));

    await clearDayAbsence(admin, {
      employeeId: session.employeeId,
      projectId: session.projectId,
      workDate,
    });

    return NextResponse.json({ ok: true, workDate, didNotWork: false });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Silinemedi';
    const status = message === 'UNAUTHORIZED' ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET(request: Request) {
  try {
    const session = await requirePersonnelSession();
    const { searchParams } = new URL(request.url);
    const admin = createAdminClient();
    const workDate = await resolveWorkDate(session.projectId, searchParams.get('date'));
    const didNotWork = await hasDayAbsence(admin, {
      employeeId: session.employeeId,
      projectId: session.projectId,
      workDate,
    });
    return NextResponse.json({ workDate, didNotWork });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Durum alınamadı';
    const status = message === 'UNAUTHORIZED' ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
