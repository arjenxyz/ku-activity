import { NextResponse } from 'next/server';
import { requirePersonnelSession } from '@/lib/personnel-auth';
import { acknowledgePersonnelDossierDownload } from '@/lib/project-closure-dossier';
import strings from '@json/src/app/api/personnel/closure/acknowledge-export/route.json';

export async function POST() {
  try {
    const session = await requirePersonnelSession();

    await acknowledgePersonnelDossierDownload({
      projectId: session.projectId,
      employeeId: session.employeeId,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : strings.failed;
    if (message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    if (message === 'CONSENT_REQUIRED') {
      return NextResponse.json({ error: strings.consentRequired }, { status: 400 });
    }
    if (message === 'DOWNLOAD_REQUIRED') {
      return NextResponse.json({ error: strings.downloadRequired }, { status: 400 });
    }
    return NextResponse.json({ error: strings.failed }, { status: 400 });
  }
}
