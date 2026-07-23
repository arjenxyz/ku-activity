import strings from '@json/src/lib/project-queries.json';
import { AdvanceRequestError } from '@/lib/advance-request-service';
import { AttendanceScanError } from '@/lib/i18n/attendance-messages';
import {
  PersonnelClosureWriteBlockedError,
  PersonnelUnlockRequiredError,
} from '@/lib/personnel-auth';
import { ProjectClosureWriteBlockedError } from '@/lib/project-closure-guard';
import { NextResponse } from 'next/server';

const INTERNAL_ERROR_PATTERNS = [
  /relation .+ does not exist/i,
  /duplicate key value/i,
  /violates .+ constraint/i,
  /syntax error/i,
  /permission denied/i,
  /connection (refused|reset|timed out)/i,
  /timeout/i,
  /invalid input syntax/i,
  /column ".+" /i,
  /JWT expired/i,
  /row-level security/i,
  /PGRST/i,
];

export function isInternalErrorMessage(message: string): boolean {
  return INTERNAL_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

export function logServerError(context: string, err: unknown): void {
  const detail = err instanceof Error ? err.stack ?? err.message : err;
  console.error(`[${context}]`, detail);
}

export function resolveApiError(
  err: unknown,
  fallback = strings.systemError
): { status: number; message: string } {
  if (err instanceof AdvanceRequestError) {
    if (err.status >= 500 || isInternalErrorMessage(err.message)) {
      logServerError('advance-request', err);
      return { status: err.status, message: fallback };
    }
    return { status: err.status, message: err.message };
  }

  if (err instanceof AttendanceScanError) {
    return { status: 400, message: err.message };
  }

  if (err instanceof PersonnelUnlockRequiredError) {
    return { status: 423, message: 'UNLOCK_REQUIRED' };
  }

  if (
    err instanceof ProjectClosureWriteBlockedError ||
    err instanceof PersonnelClosureWriteBlockedError
  ) {
    return { status: 423, message: 'PROJECT_IN_CLOSURE' };
  }

  if (err instanceof Error) {
    if (err.message === 'UNAUTHORIZED' || err.message === 'Unauthorized') {
      return { status: 401, message: 'UNAUTHORIZED' };
    }
    if (err.message === 'FORBIDDEN') {
      return { status: 403, message: strings.forbidden };
    }
    if (err.message.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      return { status: 500, message: strings.missingServiceRoleKey };
    }
    if (isInternalErrorMessage(err.message)) {
      logServerError('api', err);
      return { status: 500, message: fallback };
    }
    if (err.message.length > 0 && err.message.length <= 240 && !err.message.includes('\n')) {
      return { status: 400, message: err.message };
    }
    logServerError('api', err);
    return { status: 500, message: fallback };
  }

  logServerError('api', err);
  return { status: 500, message: fallback };
}

/** Personel API catch blokları için tek tip JSON hata yanıtı. */
export function personnelApiErrorResponse(err: unknown, fallback: string) {
  const { status, message } = resolveApiError(err, fallback);
  return NextResponse.json({ error: message }, { status });
}
