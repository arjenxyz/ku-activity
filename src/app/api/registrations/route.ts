import { NextResponse } from 'next/server';
import { getSiteSession } from '@/lib/auth/get-site-session';
import {
  createRegistration,
  listRegistrationsForOwner,
  ownerKeyForRole,
} from '@/lib/demo/registrations-store';
import { getDemoProfile } from '@/lib/demo/profiles-store';
import { getCatalogEvent, isRegistrationOpen } from '@/lib/events/catalog';
import { presentRegistration } from '@/lib/registrations/present';

export async function GET() {
  const session = await getSiteSession();
  if (!session || (session.role !== 'student' && session.role !== 'admin')) {
    return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });
  }
  const ownerKey = ownerKeyForRole(session.role === 'admin' ? 'student' : session.role);
  const rows = listRegistrationsForOwner(ownerKey).map(presentRegistration);
  return NextResponse.json({ registrations: rows });
}

export async function POST(request: Request) {
  const session = await getSiteSession();
  if (!session || session.role !== 'student') {
    return NextResponse.json({ error: 'Öğrenci oturumu gerekli' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    eventId?: string;
    dayIds?: string[];
    activityIds?: string[];
    logistics?: { transport?: string; meal?: string; note?: string };
  } | null;

  const eventId = body?.eventId?.trim();
  if (!eventId) {
    return NextResponse.json({ error: 'Etkinlik seçilmedi' }, { status: 400 });
  }

  const event = getCatalogEvent(eventId);
  if (!event) {
    return NextResponse.json({ error: 'Etkinlik bulunamadı' }, { status: 404 });
  }
  if (!isRegistrationOpen(event)) {
    return NextResponse.json({ error: 'Kayıt kapalı' }, { status: 400 });
  }

  const dayIds = Array.isArray(body?.dayIds) ? body.dayIds.filter(Boolean) : [];
  const activityIds = Array.isArray(body?.activityIds) ? body.activityIds.filter(Boolean) : [];
  if (event.days.length && dayIds.length === 0) {
    return NextResponse.json({ error: 'En az bir gün seç' }, { status: 400 });
  }
  for (const dayId of dayIds) {
    if (!event.days.some((day) => day.id === dayId)) {
      return NextResponse.json({ error: 'Geçersiz gün' }, { status: 400 });
    }
  }
  for (const activityId of activityIds) {
    if (!event.activities.some((activity) => activity.id === activityId)) {
      return NextResponse.json({ error: 'Geçersiz aktivite' }, { status: 400 });
    }
  }

  try {
    const profile = getDemoProfile('student');
    const row = createRegistration({
      eventId,
      ownerKey: ownerKeyForRole('student'),
      ownerName: session.name || profile?.fullName || 'Öğrenci',
      logistics: {
        transport: body?.logistics?.transport?.trim() || undefined,
        meal: body?.logistics?.meal?.trim() || undefined,
        note: body?.logistics?.note?.trim() || undefined,
      },
      dayIds,
      activityIds,
    });
    return NextResponse.json({ registration: presentRegistration(row) }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Kayıt başarısız' },
      { status: 400 }
    );
  }
}
