import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';
import { PERSONNEL_UNLOCK_COOKIE } from '@/lib/personnel-cookie';

/** Hareketsizlikten sonra tekrar PIN iste */
export const PERSONNEL_UNLOCK_IDLE_MS = 15 * 60 * 1000;

function unlockSecret(): string {
  const secret =
    process.env.PERSONNEL_UNLOCK_SECRET || process.env.FIELD_ENCRYPTION_KEY || '';
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'PERSONNEL_UNLOCK_SECRET or FIELD_ENCRYPTION_KEY must be set in production'
    );
  }
  return 'crewledger-dev-unlock-secret';
}

async function hashSessionToken(token: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function base64Url(bytes: ArrayBuffer): string {
  const bin = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function hmacSha256Base64Url(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return base64Url(sig);
}

export async function buildPersonnelUnlockCookieValue(
  sessionToken: string,
  expiresAt: Date
): Promise<string> {
  const exp = expiresAt.getTime();
  const payload = `${await hashSessionToken(sessionToken)}:${exp}`;
  const sig = await hmacSha256Base64Url(unlockSecret(), payload);
  return `${exp}.${sig}`;
}

export async function verifyPersonnelUnlockCookieValue(
  sessionToken: string | undefined,
  unlockValue: string | undefined
): Promise<boolean> {
  if (!sessionToken || !unlockValue) return false;
  const dot = unlockValue.lastIndexOf('.');
  if (dot < 0) return false;
  const exp = Number(unlockValue.slice(0, dot));
  const sig = unlockValue.slice(dot + 1);
  if (!Number.isFinite(exp) || exp <= Date.now()) return false;
  const payload = `${await hashSessionToken(sessionToken)}:${exp}`;
  const expected = await hmacSha256Base64Url(unlockSecret(), payload);
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) {
    diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  }
  return diff === 0;
}

export function personnelUnlockCookieOptions(expires: Date): Partial<ResponseCookie> {
  const isProd = process.env.NODE_ENV === 'production';
  const maxAge = Math.max(1, Math.floor((expires.getTime() - Date.now()) / 1000));
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    expires,
    maxAge,
  };
}

export async function getPersonnelUnlockExpiry(): Promise<Date> {
  return new Date(Date.now() + PERSONNEL_UNLOCK_IDLE_MS);
}

export { PERSONNEL_UNLOCK_COOKIE };
