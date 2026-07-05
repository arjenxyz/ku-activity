import { NextResponse } from 'next/server';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import {
  buildProjectLegalDossier,
  projectDossierZipFilename,
} from '@/lib/legal-dossier/build-project-legal-dossier';
import { buildDossierZip } from '@/lib/legal-dossier/build-zip';
import { apiErrorMessage } from '@/lib/project-queries';

type Ctx = { params: Promise<{ projectId: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params;
    const user = await requireAdminProjectAccess(projectId);

    const dossier = await buildProjectLegalDossier({
      projectId,
      exportedByEmail: user.email ?? 'admin',
      exportedById: user.id,
    });

    const zip = await buildDossierZip(dossier.files);
    const filename = projectDossierZipFilename(
      dossier.projectCode,
      dossier.projectName,
      String(dossier.manifest.exportedAt)
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
