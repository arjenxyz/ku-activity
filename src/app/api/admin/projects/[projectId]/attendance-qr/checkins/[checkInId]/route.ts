import { NextResponse } from 'next/server';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import { createAdminClient } from '@/utils/supabase/admin';
import { removeSessionCheckIn, updateSessionCheckInPlan } from '@/lib/attendance-qr-service';
import type { MesaiType } from '@/lib/work-log';
import { apiErrorMessage } from '@/lib/project-queries';
import { isUuid } from '@/lib/api-validation';
import { assertProjectWritable, ProjectClosureWriteBlockedError } from '@/lib/project-closure-guard';
import closureRouteStrings from '@json/src/app/api/admin/projects/[projectId]/route.json';
import strings from '@json/src/app/api/admin/projects/[projectId]/attendance-qr/checkins/[checkInId]/route.json';

type Ctx = { params: Promise<{ projectId: string; checkInId: string }> };

const ALLOWED_MESAI: MesaiType[] = ['none', 'ceyrek', 'yarim', 'tam'];

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const { projectId, checkInId } = await ctx.params;
    if (!isUuid(projectId) || !isUuid(checkInId)) {
      return NextResponse.json({ error: strings.invalidId }, { status: 400 });
    }

    await requireAdminProjectAccess(projectId);
    await assertProjectWritable(projectId);

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: strings.invalidBody }, { status: 400 });
    }

    const amount = Number((body as { amount?: unknown }).amount);
    const mesaiRaw = (body as { mesaiType?: unknown }).mesaiType;
    const mesaiType =
      typeof mesaiRaw === 'string' && ALLOWED_MESAI.includes(mesaiRaw as MesaiType)
        ? (mesaiRaw as MesaiType)
        : 'none';
    const description =
      typeof (body as { description?: unknown }).description === 'string'
        ? (body as { description: string }).description
        : null;

    if (!Number.isFinite(amount) || (amount !== 0.5 && amount !== 1)) {
      return NextResponse.json({ error: strings.invalidAmount }, { status: 400 });
    }

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
    if (err instanceof ProjectClosureWriteBlockedError) {
      return NextResponse.json({ error: closureRouteStrings.projeKapanışta }, { status: 423 });
    }
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    const { projectId, checkInId } = await ctx.params;
    if (!isUuid(projectId) || !isUuid(checkInId)) {
      return NextResponse.json({ error: strings.invalidId }, { status: 400 });
    }

    const user = await requireAdminProjectAccess(projectId);
    await assertProjectWritable(projectId);

    const admin = createAdminClient();
    await removeSessionCheckIn(admin, {
      projectId,
      checkInId,
      removedBy: user.id,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof ProjectClosureWriteBlockedError) {
      return NextResponse.json({ error: closureRouteStrings.projeKapanışta }, { status: 423 });
    }
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
