import { NextResponse } from 'next/server';
import {
  acceptCashHandoff,
  createCashHandoff,
  getHandoff,
} from '@/lib/payments/payment-store';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: 'create' | 'accept';
      eventId?: string;
      registrationNo?: string;
      token?: string;
      staffId?: string;
      staffName?: string;
    };

    if (body.action === 'create') {
      if (!body.eventId || !body.registrationNo) {
        return NextResponse.json({ error: 'Eksik alan' }, { status: 400 });
      }
      const handoff = createCashHandoff(body.eventId, body.registrationNo);
      return NextResponse.json({ handoff });
    }

    if (body.action === 'accept') {
      if (!body.token) {
        return NextResponse.json({ error: 'Token gerekli' }, { status: 400 });
      }
      const result = acceptCashHandoff({
        token: body.token,
        staffId: body.staffId?.trim() || 'demo-staff',
        staffName: body.staffName?.trim() || 'Demo Görevli',
      });
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Geçersiz action' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'İşlem başarısız';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'Token gerekli' }, { status: 400 });
  const handoff = getHandoff(token);
  if (!handoff) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 });
  return NextResponse.json({ handoff });
}
