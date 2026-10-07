import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Public health check — does not expose secrets. */
export async function GET() {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  return NextResponse.json({
    configured,
    checkedAt: new Date().toISOString(),
  });
}
