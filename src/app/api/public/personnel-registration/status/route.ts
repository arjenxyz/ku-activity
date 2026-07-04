import { NextResponse } from 'next/server';
import { getPublicRegistrationStatus } from '@/lib/registration-service';
import { normalizeVerificationCode } from '@/lib/registration-codes';
import strings from '@json/src/app/api/public/personnel-registration/status/route.json';

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get('kod');
  if (!code) {
    return NextResponse.json({ error: strings.kodGerekli }, { status: 400 });
  }

  const status = await getPublicRegistrationStatus(normalizeVerificationCode(code));
  if (!status) {
    return NextResponse.json({ error: strings.başvuruBulunamadı }, { status: 404 });
  }

  return NextResponse.json(status);
}
