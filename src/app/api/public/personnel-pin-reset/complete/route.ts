import { NextRequest, NextResponse } from 'next/server';
import strings from '@json/src/app/api/public/personnel-pin-reset/complete/route.json';
import {
  completePersonnelPinReset,
  validatePinResetToken,
} from '@/lib/personnel-pin-reset';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('k') ?? '';
    const result = await validatePinResetToken(token);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({
      ok: true,
      employeeName: result.employeeName,
      expiresAt: result.expiresAt,
      expiresInMinutes: result.expiresInMinutes,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message: strings.bağlantıDoğrulanamadı;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { token?: string; newPin?: string };
    const token = typeof body.token === 'string' ? body.token : '';
    const newPin = typeof body.newPin === 'string' ? body.newPin : '';

    const result = await completePersonnelPinReset({ token, newPin });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message: strings.pinGüncellenemedi;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
