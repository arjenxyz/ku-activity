import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin-auth';
import { applyOcrToDraft, DekontImportError } from '@/lib/dekont-import-service';
import strings from '@json/src/app/api/admin/dekont/drafts/[id]/apply-ocr/route.json';

type Ctx = { params: Promise<{ id: string }> };

export const runtime = 'nodejs';

export async function POST(request: Request, ctx: Ctx) {
  try {
    const user = await requireAdminUser();
    const { id } = await ctx.params;
    const body = (await request.json()) as { rawText?: string; source?: string };
    const rawText = typeof body.rawText === 'string' ? body.rawText : '';
    const source = body.source === 'vision' ? 'vision' : 'tesseract';

    const result = await applyOcrToDraft(user.id, id, rawText, source);
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
      { error: err instanceof Error ? err.message : strings.applyFailed },
      { status: 500 }
    );
  }
}
