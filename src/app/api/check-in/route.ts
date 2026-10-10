import { NextResponse } from 'next/server';
import { getSiteSession } from '@/lib/auth/get-site-session';
import { isManualCheckinCode } from '@/lib/checkin-token';
import { getCatalogEvent } from '@/lib/events/catalog-store';
import { recordCheckIn } from '@/lib/demo/registrations-store';
import { isCheckinQrToken } from '@/lib/qr/qr-service';

export async function POST(request: Request) {
  const session = await getSiteSession();
  if (!session || (session.role !== 'staff' && session.role !== 'admin')) {
    return NextResponse.json({ error: 'Görevli oturumu gerekli' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    token?: string;
    eventId?: string;
    dayId?: string | null;
  } | null;

  const token = body?.token?.trim() ?? '';
  const eventId = body?.eventId?.trim() ?? '';
  if (!isCheckinQrToken(token) && !isManualCheckinCode(token)) {
    return NextResponse.json({ error: 'Geçersiz QR veya manuel kod' }, { status: 400 });
  }
  if (!eventId) {
    return NextResponse.json({ error: 'Etkinlik seçilmedi' }, { status: 400 });
  }

  const event = getCatalogEvent(eventId);
  if (!event) {
    return NextResponse.json({ error: 'Etkinlik bulunamadı' }, { status: 404 });
  }
  if (session.role === 'staff' && !event.assignedToStaff) {
    return NextResponse.json({ error: 'Bu etkinliğe atanmadın' }, { status: 403 });
  }

  let dayId: string | null = body?.dayId === undefined ? null : body.dayId;
  if (dayId) {
    if (!event.days.some((day) => day.id === dayId)) {
      return NextResponse.json({ error: 'Geçersiz gün' }, { status: 400 });
    }
  } else if (event.days.length === 1) {
    dayId = event.days[0].id;
  }

  try {
    const result = recordCheckIn({
      token,
      eventId,
      dayId,
      staffKey: session.role,
    });
    const day = event.days.find((item) => item.id === result.attendance.dayId);
    const cardName = result.checkCard?.name ?? null;
    const nextName = result.nextCheckCard?.name ?? null;
    let message: string;
    if (result.duplicate && result.completed) {
      message = 'Tüm check kartları tamamlandı';
    } else if (result.duplicate) {
      message = cardName
        ? `“${cardName}” zaten okutulmuş`
        : 'Bu katılımcı için check-in zaten kayıtlı';
    } else if (result.completed) {
      message = cardName
        ? `“${cardName}” kaydedildi · tüm kartlar tamam`
        : 'Check-in kaydedildi · tüm kartlar tamam';
    } else {
      message = cardName
        ? `“${cardName}” kaydedildi${nextName ? ` · sıradaki: ${nextName}` : ''}`
        : 'Check-in kaydedildi';
    }

    return NextResponse.json({
      ok: true,
      duplicate: result.duplicate,
      completed: result.completed,
      registrationNo: result.registration.registrationNo,
      name: result.registration.ownerName,
      eventTitle: event.title,
      dayLabel: day?.label ?? null,
      checkedInAt: result.attendance.checkedInAt,
      checkCardName: cardName,
      nextCheckCardName: nextName,
      message,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Check-in başarısız' },
      { status: 400 }
    );
  }
}
