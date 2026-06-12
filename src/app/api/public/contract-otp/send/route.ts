import { NextResponse } from 'next/server';

/** @deprecated prepare endpoint kullanın */
export async function POST() {
  return NextResponse.json(
    { error: 'Bu uç nokta kullanımdan kaldırıldı. Lütfen sayfayı yenileyin.' },
    { status: 410 }
  );
}
