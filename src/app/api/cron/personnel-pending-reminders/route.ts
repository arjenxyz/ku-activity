import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { sendPersonnelPendingReminderEmail } from '@/lib/personnel-reminder-email';

export const dynamic = 'force-dynamic';

function authorize(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV === 'development';
  const header = request.headers.get('authorization');
  return header === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const admin = createAdminClient();
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: logs, error } = await admin
    .from('work_logs')
    .select('employee_id, admin_confirmed_at')
    .not('admin_confirmed_at', 'is', null)
    .is('employee_confirmed_at', null)
    .is('employee_disputed_at', null)
    .eq('approved', false)
    .lt('admin_confirmed_at', cutoff);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const counts = new Map<string, number>();
  for (const row of logs ?? []) {
    counts.set(row.employee_id, (counts.get(row.employee_id) ?? 0) + 1);
  }

  let sent = 0;
  const failures: string[] = [];

  for (const [employeeId, count] of counts) {
    const { data: emp } = await admin
      .from('employees')
      .select('name, email')
      .eq('id', employeeId)
      .maybeSingle();

    if (!emp?.email) continue;

    try {
      await sendPersonnelPendingReminderEmail(emp.email, emp.name, count);
      sent += 1;
    } catch (e) {
      failures.push(e instanceof Error ? e.message : String(e));
    }
  }

  return NextResponse.json({
    candidates: counts.size,
    sent,
    failures: failures.slice(0, 5),
  });
}
