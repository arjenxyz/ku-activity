import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin-auth';
import { confirmDekontDraft, confirmRetroactiveDekontDraft, DekontImportError, loadDekontDraft } from '@/lib/dekont-import-service';
import { AdvanceRequestError } from '@/lib/advance-request-service';
import strings from '@json/src/app/api/admin/dekont/drafts/[id]/route.json';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const user = await requireAdminUser();
    const { id } = await ctx.params;
    const draft = await loadDekontDraft(user.id, id);
    const { ibanEmployeeSuggestions, ...draftRow } = draft;
    return NextResponse.json({ draft: draftRow, ibanEmployeeSuggestions });
  } catch (err) {
    if (err instanceof DekontImportError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: strings.taslakYüklenemedi }, { status: 500 });
  }
}

export async function POST(request: Request, ctx: Ctx) {
  try {
    const user = await requireAdminUser();
    const { id } = await ctx.params;
    const body = await request.json();

    if (body.retroactive === true) {
      const record = await confirmRetroactiveDekontDraft({
        adminUserId: user.id,
        draftId: id,
        employeeId: String(body.employeeId ?? ''),
        projectId: String(body.projectId ?? ''),
        referenceNo: typeof body.referenceNo === 'string' ? body.referenceNo : undefined,
        paymentDate: typeof body.paymentDate === 'string' ? body.paymentDate : undefined,
        amount: typeof body.amount === 'number' && body.amount > 0 ? body.amount : undefined,
      });
      return NextResponse.json({ request: record });
    }

    const record = await confirmDekontDraft({
      adminUserId: user.id,
      draftId: id,
      requestId: String(body.requestId ?? ''),
      projectId: String(body.projectId ?? ''),
      referenceNo: typeof body.referenceNo === 'string' ? body.referenceNo : undefined,
      paymentDate: typeof body.paymentDate === 'string' ? body.paymentDate : undefined,
      amount: typeof body.amount === 'number' && body.amount > 0 ? body.amount : undefined,
      transferCodeOverride: body.transferCodeOverride === true,
      forcePaymentOverride: body.forcePaymentOverride === true,
    });

    return NextResponse.json({ request: record });
  } catch (err) {
    if (err instanceof DekontImportError || err instanceof AdvanceRequestError) {
      return NextResponse.json({ error: err.message }, { status: err instanceof AdvanceRequestError ? err.status : (err as DekontImportError).status });
    }
    return NextResponse.json({ error: strings.kayıtBaşarısız }, { status: 500 });
  }
}
