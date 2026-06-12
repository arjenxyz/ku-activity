import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin-auth';
import { buildLegalDossier, dossierZipFilename } from '@/lib/legal-dossier/build-legal-dossier';
import { buildDossierZip } from '@/lib/legal-dossier/build-zip';
import { apiErrorMessage } from '@/lib/project-queries';

type Ctx = { params: Promise<{ projectId: string; employeeId: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const user = await requireAdminUser();
    const { projectId, employeeId } = await ctx.params;

    const dossier = await buildLegalDossier({
      projectId,
      employeeId,
      exportedByEmail: user.email ?? 'admin',
      exportedById: user.id,
      exportType: 'admin',
    });

    const zip = await buildDossierZip(dossier.files);
    const filename = dossierZipFilename(
      dossier.employeeName,
      String(dossier.manifest.exportedAt),
      'admin'
    );

    return new NextResponse(new Uint8Array(zip), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
