import { NextResponse } from 'next/server';
import { getPublicVapidKey } from '@/lib/personnel-push-service';

export async function GET() {
  const publicKey = getPublicVapidKey();
  if (!publicKey) {
    return NextResponse.json({ enabled: false, publicKey: null });
  }
  return NextResponse.json({ enabled: true, publicKey });
}
