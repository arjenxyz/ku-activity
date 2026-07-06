import { NextResponse } from 'next/server';
import { requirePersonnelSession } from '@/lib/personnel-auth';
import { confirmClosureAccelerationLink } from '@/lib/closure-deletion-acceleration';
import strings from '@json/src/app/api/personnel/closure/accelerate-deletion/route.json';

function mapError(message: string) {
  switch (message) {
    case 'CHALLENGE_NOT_FOUND':
      return { status: 400, error: strings.invalidLink };
    case 'CHALLENGE_EXPIRED':
      return { status: 400, error: strings.challengeExpired };
    default:
      return { status: 400, error: strings.generic };
  }
}

export async function POST(request: Request) {
  try {
    const session = await requirePersonnelSession({ skipUnlockCheck: true });
    const body = (await request.json()) as { linkToken?: string };
    const linkToken = body.linkToken?.trim();
    if (!linkToken) {
      return NextResponse.json({ error: strings.linkRequired }, { status: 400 });
    }

    const result = await confirmClosureAccelerationLink({
      projectId: session.projectId,
      employeeId: session.employeeId,
      linkToken,
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : strings.generic;
    if (message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: strings.unauthorized }, { status: 401 });
    }
    const mapped = mapError(message);
    return NextResponse.json({ error: mapped.error }, { status: mapped.status });
  }
}
