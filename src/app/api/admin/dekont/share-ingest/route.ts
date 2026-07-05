import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin-auth';
import { ingestDekontDraft, DekontImportError } from '@/lib/dekont-import-service';
import { encodeScanReport } from '@/lib/dekont-scan-report';
import strings from '@json/src/app/api/admin/dekont/share-ingest/route.json';

export const runtime = 'nodejs';

function pickSharedFile(form: FormData): File | null {
  for (const key of ['dekont', 'files', 'file']) {
    const value = form.get(key);
    if (value instanceof File && value.size > 0) return value;
  }
  for (const value of form.values()) {
    if (value instanceof File && value.size > 0) return value;
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const user = await requireAdminUser();
    const form = await request.formData();
    const file = pickSharedFile(form);
    if (!file) {
      return NextResponse.json({ error: strings.paylaşılanDosyaBulunamadı }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { draftId } = await ingestDekontDraft({
      adminUserId: user.id,
      buffer,
      fileName: file.name || 'dekont.pdf',
      mimeType: file.type || 'application/octet-stream',
    });

    const url = new URL('/admin-panel/dekont-paylas', request.url);
    url.searchParams.set('draft', draftId);
    return NextResponse.redirect(url, 303);
  } catch (err) {
    if (err instanceof DekontImportError) {
      const url = new URL('/admin-panel/dekont-paylas', request.url);
      url.searchParams.set('error', err.report?.summary ?? err.message.slice(0, 240));
      if (err.report) {
        url.searchParams.set('scan', encodeScanReport(err.report));
      }
      return NextResponse.redirect(url, 303);
    }
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      const login = new URL('/admin-panel/login', request.url);
      login.searchParams.set('next', '/admin-panel/dekont-paylas');
      return NextResponse.redirect(login, 303);
    }
    return NextResponse.json({ error: strings.paylaşımIşlenemedi }, { status: 500 });
  }
}
