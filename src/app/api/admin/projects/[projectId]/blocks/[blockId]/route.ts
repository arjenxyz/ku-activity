import { NextResponse } from 'next/server';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import { completeProjectBlock } from '@/lib/block-team-service';
import { createAdminClient } from '@/utils/supabase/admin';
import { apiErrorMessage } from '@/lib/project-queries';
import strings from '@json/src/app/api/admin/projects/[projectId]/blocks/[blockId]/route.json';

type Ctx = { params: Promise<{ projectId: string; blockId: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const { projectId, blockId } = await ctx.params;
    await requireAdminProjectAccess(projectId);
    const body = await request.json();
    const { status } = body as { status?: string };

    const admin = createAdminClient();

    if (status === 'completed') {
      const block = await completeProjectBlock(admin, projectId, blockId);
      return NextResponse.json({ block });
    }

    return NextResponse.json({ error: strings.geçersizIşlem }, { status: 400 });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
