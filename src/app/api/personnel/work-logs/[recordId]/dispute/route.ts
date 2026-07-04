import { NextResponse } from 'next/server';
import strings from '@json/src/app/api/personnel/work-logs/[recordId]/dispute/route.json';

export async function POST() {
  return NextResponse.json(
    { error: strings.yevmiyeItirazıKaldırıldıSorunIçinYöneticinizle },
    { status: 410 }
  );
}
