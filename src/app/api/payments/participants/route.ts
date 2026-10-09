import { NextResponse } from 'next/server';
import {
  getParticipant,
  listParticipantsForEvent,
} from '@/lib/payments/payment-store';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId');
  const registrationNo = searchParams.get('registrationNo');

  if (eventId && registrationNo) {
    const participant = getParticipant(eventId, registrationNo);
    if (!participant) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 });
    return NextResponse.json({ participant });
  }

  if (eventId) {
    return NextResponse.json({ participants: listParticipantsForEvent(eventId) });
  }

  return NextResponse.json({ error: 'eventId gerekli' }, { status: 400 });
}
