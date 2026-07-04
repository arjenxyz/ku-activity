import { randomBytes } from 'crypto';

export const ADVANCE_CASH_TOKEN_PREFIX = 'AVN-';
const TOKEN_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateTokenBody(length = 12) {
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += TOKEN_CHARS[bytes[i]! % TOKEN_CHARS.length];
  }
  return out;
}

export function generateAdvanceCashToken() {
  return `${ADVANCE_CASH_TOKEN_PREFIX}${generateTokenBody(12)}`;
}

export function normalizeAdvanceCashToken(raw: string): string | null {
  const text = raw.trim().toUpperCase();
  const match = text.match(/AVN-[A-Z0-9]{10,14}/);
  return match ? match[0] : null;
}

export function parseAdvanceCashTokenFromQr(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;

  try {
    const url = new URL(text);
    const t = url.searchParams.get('t') ?? url.searchParams.get('token');
    if (t) return normalizeAdvanceCashToken(t);
  } catch {
    // düz metin
  }

  return normalizeAdvanceCashToken(text);
}

export function buildAdvanceCashQrUrl(token: string, origin?: string) {
  const base =
    origin ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.VERCEL_URL?.replace(/^/, 'https://') ??
    'https://crewledger.vercel.app';
  return `${base.replace(/\/$/, '')}/personnel-panel/avans-onay?t=${encodeURIComponent(token)}`;
}

export const ADVANCE_CASH_TOKEN_TTL_DAYS = 7;

export function advanceCashTokenExpiresAt(from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + ADVANCE_CASH_TOKEN_TTL_DAYS);
  return d;
}
