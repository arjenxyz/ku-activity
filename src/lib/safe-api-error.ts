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
  fallback = 'Sistem hatası'
): { status: number; message: string } {
  if (err instanceof Error) {
    if (err.message === 'UNAUTHORIZED' || err.message === 'Unauthorized') {
      return { status: 401, message: 'UNAUTHORIZED' };
    }
    if (err.message === 'FORBIDDEN') {
      return { status: 403, message: 'FORBIDDEN' };
    }
    if (err.message.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      return { status: 500, message: 'Server configuration error' };
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

export function apiErrorResponse(err: unknown, fallback: string) {
  const { status, message } = resolveApiError(err, fallback);
  return NextResponse.json({ error: message }, { status });
}
