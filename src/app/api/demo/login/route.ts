import { NextResponse } from 'next/server';
import { findDemoAccount } from '@/lib/demo/accounts';
import { DEMO_COOKIE } from '@/lib/demo/session';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    email?: string;
    password?: string;
  } | null;

  const account = findDemoAccount(body?.email ?? '', body?.password ?? '');
  if (!account) {
    return NextResponse.json({ error: 'Demo bilgileri hatalı' }, { status: 401 });
  }

  const response = NextResponse.json({ role: account.role, name: account.fullName });
  response.cookies.set(DEMO_COOKIE, account.role, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === 'production',
  });
  return response;
}
