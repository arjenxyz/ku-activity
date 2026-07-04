import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin-auth';
import { analyzeDekontOnly, DekontImportError } from '@/lib/dekont-import-service';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const user = await requireAdminUser();
    const form = await request.formData();
    const file = form.get('file') ?? form.get('dekont');
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'Dekont dosyası zorunludur' }, { status: 400 });
    }

    const projectId = typeof form.get('projectId') === 'string' ? String(form.get('projectId')) : null;
    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await analyzeDekontOnly({
      adminUserId: user.id,
      buffer,
      fileName: file.name || 'dekont.pdf',
      mimeType: file.type || 'application/octet-stream',
      projectId,
    });

    return NextResponse.json({ ...result, validation: result.validation });
  } catch (err) {
    if (err instanceof DekontImportError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Oturum geçersiz' }, { status: 401 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Analiz başarısız' },
      { status: 500 }
    );
  }
}
