import { NextResponse } from 'next/server';
import strings from '@json/src/app/api/public/contract-otp/send/route.json';

/** @deprecated prepare endpoint kullanın */
export async function POST() {
  return NextResponse.json(
    { error: strings.buUçNoktaKullanımdanKaldırıldıLütfen },
    { status: 410 }
  );
}
