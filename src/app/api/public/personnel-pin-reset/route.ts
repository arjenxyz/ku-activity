import { NextRequest, NextResponse } from 'next/server';
import {
  lookupPinResetEmailHint,
  submitPersonnelPinResetRequest,
} from '@/lib/personnel-pin-reset';

export const dynamic = 'force-dynamic';

type Body = {
  action?: 'request' | 'email-hint';
  tcKimlik?: string;
  phone?: string;
  email?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    const action = body.action === 'email-hint' ? 'email-hint' : 'request';
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

    const result = await submitPersonnelPinResetRequest({ tcKimlik, phone, email });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Talep gönderilemedi';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
