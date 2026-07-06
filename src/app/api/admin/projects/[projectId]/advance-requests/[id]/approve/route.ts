import { NextResponse } from 'next/server';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import { createAdminClient } from '@/utils/supabase/admin';
import { AdvanceRequestError, approveAdvanceRequest, getActiveTransferToken } from '@/lib/advance-request-service';
import type { AdvancePaymentMethod } from '@/lib/advance-types';
import strings from '@json/src/app/api/admin/projects/[projectId]/advance-requests/[id]/approve/route.json';

type Ctx = { params: Promise<{ projectId: string; id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  try {
    const { projectId, id } = await ctx.params;
    const actor = await requireAdminProjectAccess(projectId);
    const body = await request.json();

    const approvedAmount = Number(body.approvedAmount ?? body.amount);
    const paymentMethod = body.paymentMethod as AdvancePaymentMethod;
    if (paymentMethod !== 'bank_transfer' && paymentMethod !== 'cash') {
      return NextResponse.json({ error: strings.ödemeYöntemiSeçinHavaleVeyaNakit }, { status: 400 });
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

    let transferToken: string | null = null;
    let transferTokenExpiresAt: string | null = null;
    if (paymentMethod === 'bank_transfer') {
      const tokenRow = await getActiveTransferToken(admin, id, projectId);
      transferToken = tokenRow?.token ?? null;
      transferTokenExpiresAt = tokenRow?.expires_at ?? null;
    }

    return NextResponse.json({ request: record, transferToken, transferTokenExpiresAt });
  } catch (err) {
    if (err instanceof AdvanceRequestError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
    }
    return NextResponse.json({ error: strings.onayBaşarısız }, { status: 500 });
  }
}
