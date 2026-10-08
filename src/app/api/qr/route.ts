import { NextResponse } from 'next/server';
import {
  isApprovalQrCode,
  isCheckinQrToken,
  renderApprovalQrPng,
  renderCheckinQrPng,
} from '@/lib/qr/qr-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const code = params.get('code') ?? '';
  const token = params.get('token') ?? '';

  try {
    if (token) {
      if (!isCheckinQrToken(token)) {
        return NextResponse.json({ error: 'Geçersiz check-in token' }, { status: 400 });
      }
      const png = await renderCheckinQrPng(token);
      return new NextResponse(new Uint8Array(png), {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'private, max-age=300',
        },
      });
    }

    if (!isApprovalQrCode(code)) {
      return NextResponse.json({ error: 'Geçersiz onay kodu' }, { status: 400 });
    }

    const png = await renderApprovalQrPng(code);
    return new NextResponse(new Uint8Array(png), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json({ error: 'QR üretilemedi' }, { status: 500 });
  }
}
