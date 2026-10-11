import { NextResponse } from 'next/server';
import { listPublicTeamMembers } from '@/lib/team/members-store';

export const dynamic = 'force-dynamic';

/** Public roster for /ekip */
export async function GET() {
  return NextResponse.json({ members: listPublicTeamMembers() });
}
