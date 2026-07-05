import { NextResponse } from 'next/server';
import { requirePersonnelSession } from '@/lib/personnel-auth';
import { buildLegalDossier, dossierZipFilename } from '@/lib/legal-dossier/build-legal-dossier';
import { buildDossierZip } from '@/lib/legal-dossier/build-zip';
import { createAdminClient } from '@/utils/supabase/admin';
import { recordPersonnelDossierExported } from '@/lib/project-closure-dossier';
import strings from '@json/src/app/api/personnel/my-dossier/route.json';

export async function GET() {
  try {
    const session = await requirePersonnelSession();
    const admin = createAdminClient();

    const { data: emp } = await admin
      .from('employees')
      .select('email, name')
      .eq('id', session.employeeId)
      .maybeSingle();

    if (!emp?.email) {
      return NextResponse.json({ error: strings.personelBulunamadı }, { status: 404 });
    }

    const dossier = await buildLegalDossier({
      projectId: session.projectId,
      employeeId: session.employeeId,
      exportedByEmail: emp.email,
      exportedById: null,
      exportType: 'personnel_self',
    });

    const zip = await buildDossierZip(dossier.files);
    const filename = dossierZipFilename(
      dossier.employeeName,
      String(dossier.manifest.exportedAt),
      'personnel_self'
    );

    await recordPersonnelDossierExported({
      projectId: session.projectId,
      employeeId: session.employeeId,
    }).catch(() => undefined);

    return new NextResponse(new Uint8Array(zip), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message: strings.i̇ndirilemedi;
    const status = message === 'UNAUTHORIZED' ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
