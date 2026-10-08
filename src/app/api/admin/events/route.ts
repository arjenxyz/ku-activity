import { NextResponse } from 'next/server';
import { getSiteSession } from '@/lib/auth/get-site-session';
import type { CatalogEventStatus } from '@/lib/events/catalog';
import {
  createCatalogEvent,
  listCatalogEvents,
  updateCatalogEventStatus,
} from '@/lib/events/catalog-store';
import { listRegistrationsForEvent } from '@/lib/demo/registrations-store';

export async function GET() {
  const session = await getSiteSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin oturumu gerekli' }, { status: 401 });
  }

  const events = listCatalogEvents().map((event) => ({
    ...event,
    registeredCount: listRegistrationsForEvent(event.id).length,
  }));
  return NextResponse.json({ events });
}

export async function POST(request: Request) {
  const session = await getSiteSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin oturumu gerekli' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    title?: string;
    description?: string;
    location?: string;
    startsAtIso?: string;
    endsAtIso?: string;
    capacity?: number;
    status?: CatalogEventStatus;
    registrationDeadlineIso?: string;
    assignedToStaff?: boolean;
    registrationPrefix?: string;
    days?: Array<{ label: string; dateIso: string }>;
    activities?: Array<{ dayIndex: number; title: string; startsAt?: string }>;
  } | null;

  try {
    const event = createCatalogEvent({
      title: body?.title ?? '',
      description: body?.description ?? '',
      location: body?.location ?? '',
      startsAtIso: body?.startsAtIso ?? '',
      endsAtIso: body?.endsAtIso ?? '',
      capacity: Number(body?.capacity),
      status: body?.status ?? 'registration_open',
      registrationDeadlineIso: body?.registrationDeadlineIso ?? body?.startsAtIso ?? '',
      assignedToStaff: Boolean(body?.assignedToStaff),
      registrationPrefix: body?.registrationPrefix ?? '',
      days: Array.isArray(body?.days) ? body.days : [],
      activities: Array.isArray(body?.activities) ? body.activities : [],
    });
    return NextResponse.json({ event }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Oluşturulamadı' },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  const session = await getSiteSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin oturumu gerekli' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    id?: string;
    status?: CatalogEventStatus;
  } | null;

  if (!body?.id || !body.status) {
    return NextResponse.json({ error: 'id ve status gerekli' }, { status: 400 });
  }

  try {
    const event = updateCatalogEventStatus(body.id, body.status);
    return NextResponse.json({ event });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Güncellenemedi' },
      { status: 400 }
    );
  }
}
