import { NextResponse } from 'next/server';
import { requireProjectOwner } from '@/lib/project-collaborators';
import {
  getOrCreateCollabCode,
  listProjectCollaborators,
  rotateCollabCode,
} from '@/lib/project-collaborators';
import { apiErrorMessage } from '@/lib/project-queries';
import strings from '@json/src/app/api/admin/projects/[projectId]/collaborators/route.json';

type Ctx = { params: Promise<{ projectId: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params;
    const owner = await requireProjectOwner(projectId);
    const [collaborators, codeInfo] = await Promise.all([
      listProjectCollaborators(projectId),
      getOrCreateCollabCode(projectId, owner.id),
    ]);

    return NextResponse.json({
      collaborators,
      code: codeInfo.code,
      rotatedAt: codeInfo.rotatedAt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : strings.loadFailed;
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

/** Kod yenile */
export async function POST(_request: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params;
    const owner = await requireProjectOwner(projectId);
    const codeInfo = await rotateCollabCode(projectId, owner.id);
    return NextResponse.json({
      code: codeInfo.code,
      rotatedAt: codeInfo.rotatedAt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : strings.rotateFailed;
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
