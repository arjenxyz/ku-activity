import { NextResponse } from 'next/server';
import { requirePersonnelSession } from '@/lib/personnel-auth';
import { prepareClosureAccelerationOtp } from '@/lib/closure-deletion-acceleration';
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
    case 'INVALID_EMAIL':
      return { status: 400, error: strings.invalidEmail };
    case 'EMAIL_NOT_CONFIGURED':
      return { status: 503, error: strings.emailNotConfigured };
    case 'RATE_LIMITED':
      return { status: 429, error: strings.rateLimited };
    default:
      return { status: 400, error: strings.generic };
  }
}

export async function POST() {
  try {
    const session = await requirePersonnelSession();
    const result = await prepareClosureAccelerationOtp({
      projectId: session.projectId,
      employeeId: session.employeeId,
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
