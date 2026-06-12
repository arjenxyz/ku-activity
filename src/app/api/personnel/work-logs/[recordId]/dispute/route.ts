import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { requirePersonnelSession } from '@/lib/personnel-auth';
import { employeeDisputeWorkLog } from '@/lib/work-log-service';
import { getWorkLogApprovalStatus } from '@/lib/work-log';

type Ctx = { params: Promise<{ recordId: string }> };

export async function POST(request: Request, ctx: Ctx) {
  try {
    const session = await requirePersonnelSession();
    const { recordId } = await ctx.params;
    const body = (await request.json()) as { note?: string };

    const admin = createAdminClient();
    const record = await employeeDisputeWorkLog(admin, {
      recordId,
      employeeId: session.employeeId,
      note: body.note ?? '',
    });

    return NextResponse.json({
      record,
      status: getWorkLogApprovalStatus(record),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'İtiraz kaydedilemedi';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
