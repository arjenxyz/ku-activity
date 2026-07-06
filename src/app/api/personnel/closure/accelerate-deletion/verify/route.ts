import { NextResponse } from 'next/server';
import { requirePersonnelSession } from '@/lib/personnel-auth';
import { verifyClosureAccelerationOtp } from '@/lib/closure-deletion-acceleration';
import strings from '@json/src/app/api/personnel/closure/accelerate-deletion/route.json';

function mapError(message: string) {
  switch (message) {
    case 'CLOSURE_NOT_ACTIVE':
      return { status: 400, error: strings.closureNotActive };
    case 'CONSENT_REQUIRED':
      return { status: 400, error: strings.consentRequired };
    case 'DOWNLOAD_REQUIRED':
      return { status: 400, error: strings.downloadRequired };
    case 'ACK_REQUIRED':
      return { status: 400, error: strings.ackRequired };
    case 'ALREADY_ACCELERATED':
      return { status: 400, error: strings.alreadyAccelerated };
    case 'CHALLENGE_NOT_FOUND':
    case 'INVALID_CODE':
      return { status: 400, error: strings.invalidCode };
    case 'CHALLENGE_EXPIRED':
      return { status: 400, error: strings.challengeExpired };
    case 'TOO_MANY_ATTEMPTS':
      return { status: 429, error: strings.tooManyAttempts };
    default:
      return { status: 400, error: strings.generic };
  }
}

export async function POST(request: Request) {
  try {
    const session = await requirePersonnelSession();
    const body = (await request.json()) as { code?: string };
    const code = body.code?.trim();
    if (!code) {
      return NextResponse.json({ error: strings.codeRequired }, { status: 400 });
    }

    const result = await verifyClosureAccelerationOtp({
      projectId: session.projectId,
      employeeId: session.employeeId,
      code,
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
