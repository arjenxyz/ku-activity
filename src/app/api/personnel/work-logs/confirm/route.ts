import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Çift onay kaldırıldı. Yoklama QR ile otomatik kaydedilir.' },
    { status: 410 }
  );
}
