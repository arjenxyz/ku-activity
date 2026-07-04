import { NextResponse } from 'next/server';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import { createAdminClient } from '@/utils/supabase/admin';
import { AdvanceRequestError, recordBankPayment } from '@/lib/advance-request-service';
import { getStorageBackend } from '@/lib/advance-external-storage';

type Ctx = { params: Promise<{ projectId: string; id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  try {
    const { projectId, id } = await ctx.params;
    const actor = await requireAdminProjectAccess(projectId);
    const form = await request.formData();

    const file = form.get('file');
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'Dekont dosyası zorunludur' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const referenceNo = typeof form.get('referenceNo') === 'string' ? String(form.get('referenceNo')) : undefined;
    const paymentDate = typeof form.get('paymentDate') === 'string' ? String(form.get('paymentDate')) : undefined;

    const admin = createAdminClient();
    const record = await recordBankPayment(admin, {
      projectId,
      requestId: id,
      paymentDate,
      referenceNo,
      fileBuffer: buffer,
      fileName: file.name || 'dekont.pdf',
      mimeType: file.type || 'application/octet-stream',
      actor,
      backend: getStorageBackend(),
    });

    return NextResponse.json({ request: record });
  } catch (err) {
    if (err instanceof AdvanceRequestError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Ödeme kaydı başarısız' }, { status: 500 });
  }
}
