import { NextResponse } from 'next/server';
import { getSiteSession } from '@/lib/auth/get-site-session';
import {
  getRawToken,
  getRegistration,
  ownerKeyForRole,
} from '@/lib/demo/registrations-store';

type Params = { params: Promise<{ id: string }> };

/** Returns opaque check-in token for the student's own registration QR. */
export async function GET(request: Request, { params }: Params) {
  const session = await getSiteSession();
  if (!session || (session.role !== 'student' && session.role !== 'admin')) {
    return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });
  }
  const { id } = await params;
  const row = getRegistration(id);
  const ownerKey = ownerKeyForRole('student');
  if (!row || (row.ownerKey !== ownerKey && session.role !== 'admin')) {
    return NextResponse.json({ error: 'Kayıt bulunamadı' }, { status: 404 });
  }
  const eventId = new URL(request.url).searchParams.get('eventId')?.trim();
  if (eventId && row.eventId !== eventId) {
    return NextResponse.json({ error: 'Bu QR bu etkinliğe ait değil' }, { status: 400 });
  }
  if (row.status !== 'confirmed') {
    return NextResponse.json({ error: 'Bu kayıt için QR yok' }, { status: 400 });
  }
  try {
    const token = getRawToken(row);
    return NextResponse.json({
      token,
      registrationId: row.id,
      registrationNo: row.registrationNo,
      manualCode: row.manualCode,
      eventId: row.eventId,
    });
  } catch {
    return NextResponse.json({ error: 'Token okunamadı' }, { status: 500 });
  }
}
