import { NextResponse } from 'next/server';
import { getSiteSession } from '@/lib/auth/get-site-session';
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
  if (!isCheckinQrToken(token)) {
    return NextResponse.json({ error: 'Geçersiz QR' }, { status: 400 });
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
    return NextResponse.json({
      ok: true,
      duplicate: result.duplicate,
      registrationNo: result.registration.registrationNo,
      name: result.registration.ownerName,
      eventTitle: event.title,
      dayLabel: day?.label ?? null,
      checkedInAt: result.attendance.checkedInAt,
      message: result.duplicate
        ? 'Bu katılımcı için check-in zaten kayıtlı'
        : 'Check-in kaydedildi',
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Check-in başarısız' },
      { status: 400 }
    );
  }
}
