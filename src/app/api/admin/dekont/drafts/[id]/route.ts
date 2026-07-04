import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin-auth';
import { confirmDekontDraft, DekontImportError, loadDekontDraft } from '@/lib/dekont-import-service';
import { AdvanceRequestError } from '@/lib/advance-request-service';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const user = await requireAdminUser();
    const { id } = await ctx.params;
    const draft = await loadDekontDraft(user.id, id);
    return NextResponse.json({ draft });
  } catch (err) {
    if (err instanceof DekontImportError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Taslak yüklenemedi' }, { status: 500 });
  }
}

export async function POST(request: Request, ctx: Ctx) {
  try {
    const user = await requireAdminUser();
    const { id } = await ctx.params;
    const body = await request.json();

    const record = await confirmDekontDraft({
      adminUserId: user.id,
      draftId: id,
      requestId: String(body.requestId ?? ''),
      projectId: String(body.projectId ?? ''),
      referenceNo: typeof body.referenceNo === 'string' ? body.referenceNo : undefined,
      paymentDate: typeof body.paymentDate === 'string' ? body.paymentDate : undefined,
    });

    return NextResponse.json({ request: record });
  } catch (err) {
    if (err instanceof DekontImportError || err instanceof AdvanceRequestError) {
      return NextResponse.json({ error: err.message }, { status: err instanceof AdvanceRequestError ? err.status : (err as DekontImportError).status });
    }
    return NextResponse.json({ error: 'Kayıt başarısız' }, { status: 500 });
  }
}
