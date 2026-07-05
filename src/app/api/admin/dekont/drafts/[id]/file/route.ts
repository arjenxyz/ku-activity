import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin-auth';
import { DekontImportError, getDraftProofFile } from '@/lib/dekont-import-service';
import strings from '@json/src/app/api/admin/dekont/drafts/[id]/file/route.json';

type Ctx = { params: Promise<{ id: string }> };

export const runtime = 'nodejs';

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const user = await requireAdminUser();
    const { id } = await ctx.params;
    const file = await getDraftProofFile(user.id, id);
    return new NextResponse(new Uint8Array(file.buffer), {
      headers: {
        'Content-Type': file.mimeType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(file.fileName)}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err) {
    if (err instanceof DekontImportError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: strings.unauthorized }, { status: 401 });
    }
    return NextResponse.json({ error: strings.fileLoadFailed }, { status: 500 });
  }
}
