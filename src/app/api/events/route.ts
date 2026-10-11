import { NextResponse } from 'next/server';
import { listCatalogEvents } from '@/lib/events/catalog-store';
import { listRegistrationsForEvent } from '@/lib/demo/registrations-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const events = listCatalogEvents().map((event) => {
    const taken = listRegistrationsForEvent(event.id).length;
    return {
      ...event,
      registeredCount: taken,
      seatsLeft: Math.max(0, event.capacity - taken),
    };
  });
  return NextResponse.json(
    { events },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
