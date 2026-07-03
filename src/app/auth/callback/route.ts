import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/auth/yeni-sifre';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/auth/yeni-sifre';
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  const failUrl = new URL('/auth/yeni-sifre', origin);
  failUrl.searchParams.set('error', 'link');
  return NextResponse.redirect(failUrl);
}
