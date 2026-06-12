import { createHash, randomBytes } from 'crypto';
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';

export { PERSONNEL_COOKIE } from './personnel-cookie';
/** Çıkış yapılana kadar oturum açık kalsın; her aktivitede süre yenilenir */
const SESSION_DAYS = 365;

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

export function getSessionExpiry(): Date {
  return new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
}

export function personnelCookieOptions(expires: Date): Partial<ResponseCookie> {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    expires,
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  };
}
