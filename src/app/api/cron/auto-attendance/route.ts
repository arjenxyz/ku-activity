import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { authorizeCronRequest } from '@/lib/cron-auth';
import { runAutoAttendanceCron } from '@/lib/auto-attendance-cron';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!authorizeCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const result = await runAutoAttendanceCron(admin);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Cron failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
