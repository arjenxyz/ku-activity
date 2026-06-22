import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Yevmiye itirazı kaldırıldı. Sorun için yöneticinizle iletişime geçin.' },
    { status: 410 }
  );
}
