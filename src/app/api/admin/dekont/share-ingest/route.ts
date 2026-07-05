import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin-auth';
import { stageDekontShare, DekontImportError } from '@/lib/dekont-import-service';
import { encodeScanReport } from '@/lib/dekont-scan-report';
import strings from '@json/src/app/api/admin/dekont/share-ingest/route.json';

export const runtime = 'nodejs';
export const maxDuration = 30;

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

function redirectToDekontPage(request: Request, params: Record<string, string>) {
  const url = new URL('/admin-panel/dekont-paylas', request.url);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  try {
    const user = await requireAdminUser();
    const form = await request.formData();
    const file = pickSharedFile(form);
    if (!file) {
      return redirectToDekontPage(request, {
        error: strings.paylaşılanDosyaBulunamadı,
      });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { draftId } = await stageDekontShare({
      adminUserId: user.id,
      buffer,
      fileName: file.name || 'dekont.pdf',
      mimeType: file.type || 'application/octet-stream',
    });

    return redirectToDekontPage(request, {
      draft: draftId,
      process: '1',
    });
  } catch (err) {
    if (err instanceof DekontImportError) {
      const params: Record<string, string> = {
        error: err.report?.summary ?? err.message.slice(0, 240),
      };
      if (err.report) {
        params.scan = encodeScanReport(err.report);
      }
      return redirectToDekontPage(request, params);
    }
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      const login = new URL('/admin-panel/login', request.url);
      login.searchParams.set('next', '/admin-panel/dekont-paylas');
      return NextResponse.redirect(login, 303);
    }
    const message = err instanceof Error ? err.message : strings.paylaşımIşlenemedi;
    return redirectToDekontPage(request, { error: message.slice(0, 240) });
  }
}
