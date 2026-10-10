import { NextResponse } from 'next/server';
import { getSiteSession } from '@/lib/auth/get-site-session';
import type { CatalogEventStatus } from '@/lib/events/catalog';
import {
  createCatalogEvent,
  listCatalogEvents,
  updateCatalogEvent,
  updateCatalogEventStatus,
  type CreateCatalogEventInput,
} from '@/lib/events/catalog-store';
import { listRegistrationsForEvent } from '@/lib/demo/registrations-store';

type EventBody = {
  id?: string;
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
  planning?: unknown;
  checkCards?: Array<{ id?: string; name?: string }>;
};

function toInput(body: EventBody | null): CreateCatalogEventInput {
  return {
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
    planning: body?.planning,
    checkCards: Array.isArray(body?.checkCards) ? body.checkCards : undefined,
  };
}

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

  const body = (await request.json().catch(() => null)) as EventBody | null;

  try {
    const event = createCatalogEvent(toInput(body));
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

  const body = (await request.json().catch(() => null)) as EventBody | null;
  if (!body?.id) {
    return NextResponse.json({ error: 'id gerekli' }, { status: 400 });
  }

  // Status-only shortcut (dropdown on cards)
  const onlyStatus =
    body.status &&
    body.title === undefined &&
    body.location === undefined &&
    body.startsAtIso === undefined;

  try {
    if (onlyStatus) {
      const event = updateCatalogEventStatus(body.id, body.status!);
      return NextResponse.json({ event });
    }
    const event = updateCatalogEvent(body.id, toInput(body));
    return NextResponse.json({ event });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Güncellenemedi' },
      { status: 400 }
    );
  }
}
