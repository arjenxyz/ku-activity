import { NextResponse } from 'next/server';
import {
  completeCustodyTransfer,
  createCustodyTransfer,
  custodyHeldBy,
  getCustodyByToken,
  listCustody,
} from '@/lib/payments/payment-store';
import type { CustodyChannel } from '@/lib/payments/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId') ?? undefined;
  const token = searchParams.get('token');
  if (token) {
    const transfer = getCustodyByToken(token);
    if (!transfer) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 });
    return NextResponse.json({ transfer });
  }
  return NextResponse.json({
    transfers: listCustody(eventId),
    holders: eventId ? custodyHeldBy(eventId) : [],
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: 'create' | 'complete';
      eventId?: string;
      amount?: number;
      channel?: CustodyChannel;
      note?: string;
      token?: string;
      fromStaffId?: string;
      fromStaffName?: string;
      toStaffId?: string;
      toStaffName?: string;
    };

    if (body.action === 'create') {
      if (!body.eventId || body.amount == null || !body.channel) {
        return NextResponse.json({ error: 'Eksik alan' }, { status: 400 });
      }
      const transfer = createCustodyTransfer({
        eventId: body.eventId,
        amount: Number(body.amount),
        channel: body.channel,
        fromStaffId: body.fromStaffId?.trim() || 'demo-staff',
        fromStaffName: body.fromStaffName?.trim() || 'Demo Görevli',
        note: body.note,
      });
      return NextResponse.json({ transfer });
    }

    if (body.action === 'complete') {
      if (!body.token) {
        return NextResponse.json({ error: 'Token gerekli' }, { status: 400 });
      }
      const transfer = completeCustodyTransfer({
        token: body.token,
        toStaffId: body.toStaffId?.trim() || 'demo-admin',
        toStaffName: body.toStaffName?.trim() || 'Demo Admin',
      });
      return NextResponse.json({ transfer });
    }

    return NextResponse.json({ error: 'Geçersiz action' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'İşlem başarısız';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
