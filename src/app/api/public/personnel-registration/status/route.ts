import { NextResponse } from 'next/server';
import { getPublicRegistrationStatus } from '@/lib/registration-service';
import { normalizeVerificationCode } from '@/lib/registration-codes';

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get('kod');
  if (!code) {
    return NextResponse.json({ error: 'Kod gerekli' }, { status: 400 });
  }

  const status = await getPublicRegistrationStatus(normalizeVerificationCode(code));
  if (!status) {
    return NextResponse.json({ error: 'Başvuru bulunamadı' }, { status: 404 });
  }

  return NextResponse.json(status);
}
