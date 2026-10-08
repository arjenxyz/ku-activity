import { NextResponse } from 'next/server';
import { getCatalogEvent } from '@/lib/events/catalog-store';
import { listRegistrationsForEvent } from '@/lib/demo/registrations-store';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const event = getCatalogEvent(id);
  if (!event) {
    return NextResponse.json({ error: 'Etkinlik bulunamadı' }, { status: 404 });
  }
  const taken = listRegistrationsForEvent(event.id).length;
  return NextResponse.json({
    event: {
      ...event,
      registeredCount: taken,
      seatsLeft: Math.max(0, event.capacity - taken),
    },
  });
}
