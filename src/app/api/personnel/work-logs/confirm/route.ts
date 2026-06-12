import { NextResponse } from 'next/server';
import dayjs from 'dayjs';
import { createAdminClient } from '@/utils/supabase/admin';
import { requirePersonnelSession } from '@/lib/personnel-auth';
import { employeeConfirmWorkLog } from '@/lib/work-log-service';
import { getWorkLogApprovalStatus } from '@/lib/work-log';

export async function POST(request: Request) {
  try {
    const session = await requirePersonnelSession();
    const body = await request.json().catch(() => ({}));
    const date =
      typeof body.date === 'string' && body.date
        ? body.date
        : dayjs().format('YYYY-MM-DD');
    const amount = body.amount === 0.5 ? 0.5 : 1;

    const admin = createAdminClient();
    const record = await employeeConfirmWorkLog(admin, {
      projectId: session.projectId,
      employeeId: session.employeeId,
      date,
      amount,
    });

    return NextResponse.json({
      record,
      status: getWorkLogApprovalStatus(record),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Onay kaydedilemedi';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
