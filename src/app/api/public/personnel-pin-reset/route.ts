import { NextRequest, NextResponse } from 'next/server';
import {
  lookupPinResetEmailHint,
  sendPersonnelPinResetLink,
  startPersonnelPinReset,
} from '@/lib/personnel-pin-reset';

export const dynamic = 'force-dynamic';

type Body = {
  action?: 'start-reset' | 'email-hint' | 'send-link';
  tcKimlik?: string;
  phone?: string;
  email?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    const action = body.action ?? 'start-reset';
    const tcKimlik = typeof body.tcKimlik === 'string' ? body.tcKimlik : '';
    const phone = typeof body.phone === 'string' ? body.phone : '';
    const email = typeof body.email === 'string' ? body.email : '';

    if (action === 'email-hint') {
      const result = await lookupPinResetEmailHint({ tcKimlik, phone });
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ ok: true, maskedEmail: result.maskedEmail });
    }

    if (action === 'send-link') {
      const result = await sendPersonnelPinResetLink({ tcKimlik, phone, email });
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ ok: true, mode: 'link' });
    }

    const result = await startPersonnelPinReset({ tcKimlik, phone, email });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      resetToken: result.resetToken,
      employeeName: result.employeeName,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Talep gönderilemedi';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
