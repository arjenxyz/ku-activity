import { NextResponse } from 'next/server';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import { createAdminClient } from '@/utils/supabase/admin';
import { AdvanceRequestError, recordRetroactiveBankPayment } from '@/lib/advance-request-service';
import strings from '@json/src/app/api/admin/projects/[projectId]/advance-requests/retroactive/route.json';

type Ctx = { params: Promise<{ projectId: string }> };

export async function POST(request: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params;
    const actor = await requireAdminProjectAccess(projectId);
    const form = await request.formData();

    const employeeId = String(form.get('employeeId') ?? '');
    const amount = Number(form.get('amount'));
    const paymentDate = String(form.get('paymentDate') ?? '');
    const referenceNo = form.get('referenceNo') ? String(form.get('referenceNo')) : undefined;
    const file = form.get('file');

    if (!employeeId) {
      return NextResponse.json({ error: strings.employeeRequired }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: strings.fileRequired }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const admin = createAdminClient();
    const record = await recordRetroactiveBankPayment(admin, {
      projectId,
      employeeId,
      amount,
      paymentDate,
      referenceNo,
      fileBuffer: buffer,
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      actor,
      proofOcrJson: form.get('proofOcrJson')
        ? (JSON.parse(String(form.get('proofOcrJson'))) as Record<string, unknown>)
        : null,
    });

    return NextResponse.json({ request: record }, { status: 201 });
  } catch (err) {
    if (err instanceof AdvanceRequestError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
    }
    return NextResponse.json({ error: strings.saveFailed }, { status: 500 });
  }
}
