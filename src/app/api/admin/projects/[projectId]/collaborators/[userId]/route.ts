import { NextResponse } from 'next/server';
import { requireProjectOwner, removeProjectCollaborator } from '@/lib/project-collaborators';
import { apiErrorMessage } from '@/lib/project-queries';
import { isUuid } from '@/lib/api-validation';
import strings from '@json/src/app/api/admin/projects/[projectId]/collaborators/[userId]/route.json';

type Ctx = { params: Promise<{ projectId: string; userId: string }> };

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    const { projectId, userId } = await ctx.params;
    if (!isUuid(projectId) || !isUuid(userId)) {
      return NextResponse.json({ error: strings.invalidId }, { status: 400 });
    }

    await requireProjectOwner(projectId);
    await removeProjectCollaborator(projectId, userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : strings.removeFailed;
    if (message === 'OWNER_REQUIRED') {
      return NextResponse.json({ error: strings.ownerOnly }, { status: 403 });
    }
    if (message === 'MIGRATION_REQUIRED') {
      return NextResponse.json({ error: strings.migrationRequired }, { status: 503 });
    }
    const { status, message: apiMsg } = apiErrorMessage(err);
    return NextResponse.json({ error: apiMsg }, { status });
  }
}
