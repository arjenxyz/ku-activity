import { NextResponse } from 'next/server';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import { createAdminClient } from '@/utils/supabase/admin';
import { removeSessionCheckIn } from '@/lib/attendance-qr-service';
import { apiErrorMessage } from '@/lib/project-queries';

type Ctx = { params: Promise<{ projectId: string; checkInId: string }> };

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
