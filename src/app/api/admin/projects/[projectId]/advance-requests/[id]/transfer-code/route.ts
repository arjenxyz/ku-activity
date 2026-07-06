import { NextResponse } from 'next/server';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import { createAdminClient } from '@/utils/supabase/admin';
import {
  AdvanceRequestError,
  ensureTransferTokenForApprovedRequest,
  getActiveTransferToken,
  regenerateTransferToken,
} from '@/lib/advance-request-service';
import strings from '@json/src/app/api/admin/projects/[projectId]/advance-requests/[id]/transfer-code/route.json';

type Ctx = { params: Promise<{ projectId: string; id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  try {
    const { projectId, id } = await ctx.params;
    await requireAdminProjectAccess(projectId);
    const regenerate = new URL(request.url).searchParams.get('regenerate') === '1';

    const admin = createAdminClient();
    const tokenRow = regenerate
      ? await regenerateTransferToken(admin, id, projectId)
      : (await getActiveTransferToken(admin, id, projectId)) ??
        (await ensureTransferTokenForApprovedRequest(admin, id, projectId));

    if (!tokenRow?.token) {
      return NextResponse.json({ error: strings.notFound }, { status: 404 });
    }

    return NextResponse.json({
      token: tokenRow.token,
      expiresAt: tokenRow.expires_at,
    });
  } catch (err) {
    if (err instanceof AdvanceRequestError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
    }
    return NextResponse.json({ error: strings.loadFailed }, { status: 500 });
  }
}
