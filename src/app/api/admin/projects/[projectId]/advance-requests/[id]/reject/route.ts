import { NextResponse } from 'next/server';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import { createAdminClient } from '@/utils/supabase/admin';
import { AdvanceRequestError, rejectAdvanceRequest } from '@/lib/advance-request-service';

type Ctx = { params: Promise<{ projectId: string; id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  try {
    const { projectId, id } = await ctx.params;
    const actor = await requireAdminProjectAccess(projectId);
    const body = await request.json().catch(() => ({}));

    const admin = createAdminClient();
    const record = await rejectAdvanceRequest(admin, {
      projectId,
      requestId: id,
      reason: typeof body.reason === 'string' ? body.reason : undefined,
      actor,
    });

    return NextResponse.json({ request: record });
  } catch (err) {
    if (err instanceof AdvanceRequestError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
    }
    return NextResponse.json({ error: 'Red başarısız' }, { status: 500 });
  }
}
