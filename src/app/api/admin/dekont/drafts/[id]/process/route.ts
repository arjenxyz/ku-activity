import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin-auth';
import { DekontImportError, processDekontDraft } from '@/lib/dekont-import-service';
import strings from '@json/src/app/api/admin/dekont/drafts/[id]/process/route.json';

type Ctx = { params: Promise<{ id: string }> };

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(_request: Request, ctx: Ctx) {
  try {
    const user = await requireAdminUser();
    const { id } = await ctx.params;
    const result = await processDekontDraft(user.id, id);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof DekontImportError) {
      return NextResponse.json(
        { error: err.message, report: err.report ?? null },
        { status: err.status }
      );
    }
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: strings.unauthorized }, { status: 401 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : strings.processFailed },
      { status: 500 }
    );
  }
}
