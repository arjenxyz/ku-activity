import { NextResponse } from 'next/server';
import { requirePersonnelSession } from '@/lib/personnel-auth';
import { getPersonnelClosureStatus } from '@/lib/project-closure-dossier';
import strings from '@json/src/app/api/personnel/closure/status/route.json';

export async function GET() {
  try {
    const session = await requirePersonnelSession();
    const status = await getPersonnelClosureStatus(session.projectId, session.employeeId);
    return NextResponse.json(status);
  } catch (err) {
    const message = err instanceof Error ? err.message : strings.unauthorized;
    const httpStatus = message === 'UNAUTHORIZED' ? 401 : 400;
    return NextResponse.json({ error: message }, { status: httpStatus });
  }
}
