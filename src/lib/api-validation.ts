/** API girdi doğrulama — OWASP input validation katmanı */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

const BASE64URL_RE = /^[A-Za-z0-9_-]+$/;

export const LIMITS = {
  shortText: 200,
  note: 1000,
  description: 500,
  projectName: 200,
  projectCode: 50,
  projectLocation: 300,
  projectDescription: 2000,
  pushEndpoint: 2048,
  pushKeyMin: 80,
  pushKeyMax: 256,
  pushAuthMin: 16,
  pushAuthMax: 128,
  maxAdvanceAmount: 50_000_000,
} as const;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}

export function parseMonthParam(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return MONTH_RE.test(trimmed) ? trimmed : null;
}

export function parseDateParam(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.slice(0, 10);
  return DATE_RE.test(trimmed) ? trimmed : null;
}

/** Kontrol karakterlerini temizler, uzunluğu sınırlar. */
export function sanitizeOptionalText(
  value: unknown,
  maxLen: number
): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(/[\u0000-\u001F\u007F]/g, '').trim();
  if (!cleaned) return null;
  return cleaned.length > maxLen ? cleaned.slice(0, maxLen) : cleaned;
}

export function sanitizeRequiredText(value: unknown, maxLen: number): string | null {
  const text = sanitizeOptionalText(value, maxLen);
  return text;
}

export type PushSubscriptionInput = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export function parsePushEndpoint(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const endpoint = typeof (body as { endpoint?: unknown }).endpoint === 'string'
    ? (body as { endpoint: string }).endpoint.trim()
    : '';
  if (!endpoint || endpoint.length > LIMITS.pushEndpoint) return null;
  try {
    const url = new URL(endpoint);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    if (url.protocol === 'http:' && !['localhost', '127.0.0.1'].includes(url.hostname)) {
      return null;
    }
    return endpoint;
  } catch {
    return null;
  }
}
export function parsePushSubscription(body: unknown): PushSubscriptionInput | null {
  if (!body || typeof body !== 'object') return null;
  const record = body as Record<string, unknown>;

  const endpoint = typeof record.endpoint === 'string' ? record.endpoint.trim() : '';
  const p256dh = typeof record.p256dh === 'string' ? record.p256dh.trim() : '';
  const auth = typeof record.auth === 'string' ? record.auth.trim() : '';

  if (!endpoint || endpoint.length > LIMITS.pushEndpoint) return null;
  if (!p256dh || p256dh.length < LIMITS.pushKeyMin || p256dh.length > LIMITS.pushKeyMax) {
    return null;
  }
  if (!auth || auth.length < LIMITS.pushAuthMin || auth.length > LIMITS.pushAuthMax) {
    return null;
  }
  if (!BASE64URL_RE.test(p256dh) || !BASE64URL_RE.test(auth)) return null;

  try {
    const url = new URL(endpoint);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    if (url.protocol === 'http:' && !['localhost', '127.0.0.1'].includes(url.hostname)) {
      return null;
    }
  } catch {
    return null;
  }

  return { endpoint, p256dh, auth };
}

export function parsePositiveAmount(value: unknown, max = LIMITS.maxAdvanceAmount): number | null {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num) || num <= 0 || num > max) return null;
  return Math.round(num * 100) / 100;
}
