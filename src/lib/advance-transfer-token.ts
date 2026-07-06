import { randomBytes } from 'crypto';

export const ADVANCE_TRANSFER_TOKEN_PREFIX = 'HVL-';
const TOKEN_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateTokenBody(length = 12) {
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += TOKEN_CHARS[bytes[i]! % TOKEN_CHARS.length];
  }
  return out;
}

export function generateAdvanceTransferToken() {
  return `${ADVANCE_TRANSFER_TOKEN_PREFIX}${generateTokenBody(12)}`;
}

/** OCR hataları: O→0, I/l→1 */
function fuzzyNormalizeTokenChars(text: string): string {
  return text
    .toUpperCase()
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1');
}

export function normalizeAdvanceTransferToken(raw: string): string | null {
  const text = fuzzyNormalizeTokenChars(raw.trim());
  const match = text.match(/HVL-[A-Z0-9]{10,14}/);
  return match ? match[0] : null;
}

export function parseAdvanceTransferTokenFromText(raw: string): string | null {
  if (!raw.trim()) return null;
  const fuzzy = fuzzyNormalizeTokenChars(raw);
  const match = fuzzy.match(/HVL-[A-Z0-9]{10,14}/);
  return match ? match[0] : null;
}

export const ADVANCE_TRANSFER_TOKEN_TTL_DAYS = 30;

export function advanceTransferTokenExpiresAt(from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + ADVANCE_TRANSFER_TOKEN_TTL_DAYS);
  return d;
}
