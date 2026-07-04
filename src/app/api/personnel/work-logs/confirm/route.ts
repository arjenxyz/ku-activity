import { NextResponse } from 'next/server';
import strings from '@json/src/app/api/personnel/work-logs/confirm/route.json';

export async function POST() {
  return NextResponse.json(
    { error: strings.çiftOnayKaldırıldıYoklamaQrIle },
    { status: 410 }
  );
}
