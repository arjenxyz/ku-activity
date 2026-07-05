import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { authorizeCronRequest } from '@/lib/cron-auth';
import { runAttendanceReminderCron } from '@/lib/personnel-notification-cron';
import strings from '@json/src/app/api/cron/personnel-pending-reminders/route.json';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!authorizeCronRequest(request)) {
    return NextResponse.json({ error: strings.yetkisiz }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const result = await runAttendanceReminderCron(admin);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Cron failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
