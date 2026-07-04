import { NextResponse } from 'next/server';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import { createAdminClient } from '@/utils/supabase/admin';
import { AdvanceRequestError, approveAdvanceRequest } from '@/lib/advance-request-service';
import type { AdvancePaymentMethod } from '@/lib/advance-types';

type Ctx = { params: Promise<{ projectId: string; id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  try {
    const { projectId, id } = await ctx.params;
    const actor = await requireAdminProjectAccess(projectId);
    const body = await request.json();

    const approvedAmount = Number(body.approvedAmount ?? body.amount);
    const paymentMethod = body.paymentMethod as AdvancePaymentMethod;
    if (paymentMethod !== 'bank_transfer' && paymentMethod !== 'cash') {
      return NextResponse.json({ error: 'Ödeme yöntemi seçin (havale veya nakit)' }, { status: 400 });
    }

    const admin = createAdminClient();
    const record = await approveAdvanceRequest(admin, {
      projectId,
      requestId: id,
      approvedAmount,
      paymentMethod,
      adminNote: typeof body.adminNote === 'string' ? body.adminNote : undefined,
      jobId: typeof body.jobId === 'string' ? body.jobId : null,
      actor,
    });

    return NextResponse.json({ request: record });
  } catch (err) {
    if (err instanceof AdvanceRequestError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
    }
    return NextResponse.json({ error: 'Onay başarısız' }, { status: 500 });
  }
}
