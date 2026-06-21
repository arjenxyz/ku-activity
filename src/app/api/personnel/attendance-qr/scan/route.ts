import { NextResponse } from 'next/server';
import dayjs from 'dayjs';
import { createAdminClient } from '@/utils/supabase/admin';
import { requirePersonnelSession } from '@/lib/personnel-auth';
import { checkInViaAttendanceQr } from '@/lib/attendance-qr-service';
import { getWorkLogApprovalStatus } from '@/lib/work-log';

export async function POST(request: Request) {
  try {
    const session = await requirePersonnelSession();
    const body = await request.json().catch(() => ({}));
    const token = typeof body.token === 'string' ? body.token.trim() : '';

    if (!token) {
      return NextResponse.json({ error: 'QR kodu gerekli' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { workLog, workDate } = await checkInViaAttendanceQr(admin, {
      token,
      employeeId: session.employeeId,
      projectId: session.projectId,
    });

    const dateLabel = dayjs(workDate).format('DD.MM.YYYY');
    const isToday = workDate === dayjs().format('YYYY-MM-DD');

    return NextResponse.json({
      ok: true,
      record: workLog,
      status: getWorkLogApprovalStatus(workLog),
      message: isToday
        ? 'Yoklama kaydedildi — bugün tam gün çalışıldı.'
        : `${dateLabel} günü için yoklama kaydedildi.`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Yoklama kaydedilemedi';
    const status = message.includes('zaten') ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
