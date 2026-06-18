import { NextResponse } from 'next/server';
import { getKeepaliveStatus } from '@/lib/supabase-keepalive';

export const dynamic = 'force-dynamic';

export async function GET() {
  const status = await getKeepaliveStatus();
  return NextResponse.json({
    ...status,
    checkedAt: new Date().toISOString(),
  });
}
