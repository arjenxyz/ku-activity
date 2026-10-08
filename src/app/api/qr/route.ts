import { NextResponse } from 'next/server';
import { isApprovalQrCode, renderApprovalQrPng } from '@/lib/qr/qr-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get('code') ?? '';
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
}
