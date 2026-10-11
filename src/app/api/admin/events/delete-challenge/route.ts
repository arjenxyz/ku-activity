import { NextResponse } from 'next/server';
import { getSiteSession } from '@/lib/auth/get-site-session';
import { getCatalogEvent } from '@/lib/events/catalog-store';
import { issueDeleteChallenge } from '@/lib/events/delete-challenge';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await getSiteSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin oturumu gerekli' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { id?: string } | null;
  const id = body?.id?.trim();
  if (!id) {
    return NextResponse.json({ error: 'id gerekli' }, { status: 400 });
  }
  if (!getCatalogEvent(id)) {
    return NextResponse.json({ error: 'Etkinlik bulunamadı' }, { status: 404 });
  }

  return NextResponse.json({ code: issueDeleteChallenge(id), eventId: id });
}
