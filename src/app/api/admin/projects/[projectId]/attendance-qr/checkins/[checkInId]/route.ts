import { NextResponse } from 'next/server';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import { createAdminClient } from '@/utils/supabase/admin';
import { removeSessionCheckIn, updateSessionCheckInPlan } from '@/lib/attendance-qr-service';
import type { MesaiType } from '@/lib/work-log';
import { apiErrorMessage } from '@/lib/project-queries';

type Ctx = { params: Promise<{ projectId: string; checkInId: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const { projectId, checkInId } = await ctx.params;
    await requireAdminProjectAccess(projectId);
    const body = await request.json().catch(() => ({}));
    const amount = Number(body.amount);
    const mesaiType = typeof body.mesaiType === 'string' ? (body.mesaiType as MesaiType) : 'none';
    const description = typeof body.description === 'string' ? body.description : null;

    const admin = createAdminClient();
    const checkIn = await updateSessionCheckInPlan(admin, {
      projectId,
      checkInId,
      amount,
      mesaiType,
      description,
    });

    return NextResponse.json({ ok: true, checkIn });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    const { projectId, checkInId } = await ctx.params;
    await requireAdminProjectAccess(projectId);

    const admin = createAdminClient();
    await removeSessionCheckIn(admin, { projectId, checkInId });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
