import { NextResponse } from 'next/server';
import dayjs from 'dayjs';
import { createAdminClient } from '@/utils/supabase/admin';
import { requirePersonnelSession } from '@/lib/personnel-auth';
import { scanAttendanceQr } from '@/lib/attendance-qr-service';

export async function POST(request: Request) {
  try {
    const session = await requirePersonnelSession();
    const body = await request.json().catch(() => ({}));
    const token = typeof body.token === 'string' ? body.token.trim() : '';

    if (!token) {
      return NextResponse.json({ error: 'QR kodu gerekli' }, { status: 400 });
    }

    const admin = createAdminClient();
    const result = await scanAttendanceQr(admin, {
      token,
      employeeId: session.employeeId,
      projectId: session.projectId,
    });

    const dateLabel = dayjs(result.workDate).format('DD.MM.YYYY');
    const isToday = result.workDate === dayjs().format('YYYY-MM-DD');

    let message: string;
    if (result.alreadyListed) {
      message = isToday
        ? 'Zaten yoklama listesindesiniz. Usta yoklamayı bitirince tam gün kaydedilecek.'
        : `${dateLabel} için zaten listedesiniz.`;
    } else {
      message = isToday
        ? 'Yoklama listesine eklendiniz. Usta bitirince tam gün yevmiye yazılacak.'
        : `${dateLabel} günü için yoklama listesine eklendiniz.`;
    }

    return NextResponse.json({
      ok: true,
      alreadyListed: result.alreadyListed,
      message,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Yoklama kaydedilemedi';
    const status = message.includes('zaten') ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
