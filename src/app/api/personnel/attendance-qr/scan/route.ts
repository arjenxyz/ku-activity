import { NextResponse } from 'next/server';
import dayjs from 'dayjs';
import { createAdminClient } from '@/utils/supabase/admin';
import { requirePersonnelSession } from '@/lib/personnel-auth';
import { scanAttendanceQr, getPersonnelAttendanceStatus } from '@/lib/attendance-qr-service';

export async function POST(request: Request) {
  try {
    const session = await requirePersonnelSession();
    const body = await request.json().catch(() => ({}));
    const token = typeof body.token === 'string' ? body.token.trim() : '';
    const replacePrevious = body.replace === true;

    if (!token) {
      return NextResponse.json({ error: 'QR kodu gerekli' }, { status: 400 });
    }

    const admin = createAdminClient();
    const result = await scanAttendanceQr(admin, {
      token,
      employeeId: session.employeeId,
      projectId: session.projectId,
      replacePrevious,
    });

    const dateLabel = dayjs(result.workDate).format('DD.MM.YYYY');
    const isToday = result.workDate === dayjs().format('YYYY-MM-DD');

    const status = await getPersonnelAttendanceStatus(admin, {
      employeeId: session.employeeId,
      projectId: session.projectId,
      workDate: result.workDate,
    });

    let message: string;
    if (replacePrevious && !result.alreadyListed) {
      message =
        'Yeniden okutma başarılı. Önceki kaydınız silindi, listeye tekrar eklendiniz.';
    } else if (result.alreadyListed) {
      message = status.message;
    } else {
      message = isToday
        ? 'Listeye eklendiniz. Ustanız diğer personelin yoklamasını alıp işlemi tamamlayacak.'
        : `${dateLabel} günü için yoklama listesine eklendiniz.`;
    }

    return NextResponse.json({
      ok: true,
      alreadyListed: result.alreadyListed,
      replaced: replacePrevious && !result.alreadyListed,
      message,
      workDate: result.workDate,
      status,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Yoklama kaydedilemedi';
    const status = message.includes('zaten') ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
