import { NextResponse } from 'next/server';
import { requirePersonnelSession } from '@/lib/personnel-auth';
import { recordClosureConsent } from '@/lib/project-closure-dossier';
import strings from '@json/src/app/api/personnel/closure/consent/route.json';

export async function POST(request: Request) {
  try {
    const session = await requirePersonnelSession();
    const userAgent = request.headers.get('user-agent');

    await recordClosureConsent({
      projectId: session.projectId,
      employeeId: session.employeeId,
      userAgent,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : strings.failed;
    if (message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    if (message === 'CLOSURE_NOT_ACTIVE') {
      return NextResponse.json({ error: strings.closureNotActive }, { status: 400 });
    }
    return NextResponse.json({ error: strings.failed }, { status: 400 });
  }
}
