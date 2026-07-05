import { NextResponse } from 'next/server';
import { requirePersonnelSession } from '@/lib/personnel-auth';
import { listDossierSectionCatalog } from '@/lib/legal-dossier/registry';
import { LEGAL_DOSSIER_SCHEMA_VERSION } from '@/lib/legal-dossier/types';
import strings from '@json/src/app/api/personnel/my-dossier/sections/route.json';

export async function GET() {
  try {
    await requirePersonnelSession();

    const sections = listDossierSectionCatalog('personnel_self');

    return NextResponse.json({
      schemaVersion: LEGAL_DOSSIER_SCHEMA_VERSION,
      sections,
      note: strings.note,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : strings.unauthorized;
    const status = message === 'UNAUTHORIZED' ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
