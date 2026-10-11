import { NextResponse } from 'next/server';
import { listPublicSponsors } from '@/lib/sponsors/sponsors-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    { sponsors: listPublicSponsors() },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
