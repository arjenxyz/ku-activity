import { NextResponse } from 'next/server';
import { requireAdminProjectAccess, requireAdminUser } from '@/lib/admin-auth';
import { apiErrorMessage } from '@/lib/project-queries';
import {
  fetchProjectWagePolicyRow,
  resolveWagePolicyForProject,
  upsertProjectWagePolicy,
} from '@/lib/wage-policy-service';
import { normalizeWagePolicy } from '@/types/wage-policy';

type Ctx = { params: Promise<{ projectId: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params;
    const user = await requireAdminUser();
    await requireAdminProjectAccess(projectId);

    const [row, resolved] = await Promise.all([
      fetchProjectWagePolicyRow(projectId, user.id),
      resolveWagePolicyForProject(projectId, user.id),
    ]);

    return NextResponse.json({
      projectRow: row,
      resolved,
    });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params;
    const user = await requireAdminUser();
    await requireAdminProjectAccess(projectId);

    const body = await request.json();
    const useCompanyDefault = body.useCompanyDefault !== false;
    const policy = body.policy ? normalizeWagePolicy(body.policy) : undefined;

    const saved = await upsertProjectWagePolicy(projectId, user.id, {
      useCompanyDefault,
      policy,
    });
    const resolved = await resolveWagePolicyForProject(projectId, user.id);

    return NextResponse.json({ projectRow: saved, resolved });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
