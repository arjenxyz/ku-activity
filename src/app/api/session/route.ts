import { NextResponse } from 'next/server';
import { getSiteSession } from '@/lib/auth/get-site-session';

export async function GET() {
  const session = await getSiteSession();
  if (!session) {
    return NextResponse.json({ session: null });
  }
  return NextResponse.json({ session });
}
