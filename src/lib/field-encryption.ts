import { createCipheriv, createDecipheriv, createHmac, randomBytes, scryptSync } from 'crypto';

const ALGO = 'aes-256-gcm';

function getKey(): Buffer {
  const secret = process.env.FIELD_ENCRYPTION_KEY;
  if (!secret || secret.length < 16) {
    throw new Error('FIELD_ENCRYPTION_KEY eksik veya çok kısa (.env)');
  }
  return scryptSync(secret, 'arjendev-personel-v1', 32);
}

export function encryptField(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decryptField(blob: string): string {
  const key = getKey();
  const buf = Buffer.from(blob, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

/** T.C. kimlik ile giriş araması — şifreli alan açılmadan eşleştirme */
export function hashTcKimlik(tc: string): string {
  const normalized = tc.replace(/\D/g, '');
  if (!/^\d{11}$/.test(normalized)) {
    throw new Error('Geçersiz T.C. kimlik numarası');
  }
  const secret = process.env.FIELD_ENCRYPTION_KEY;
  if (!secret || secret.length < 16) {
    throw new Error('FIELD_ENCRYPTION_KEY eksik veya çok kısa (.env)');
  }
  return createHmac('sha256', secret).update(`tc-lookup-v1:${normalized}`).digest('hex');
}

export function maskTcKimlik(tc: string) {
  const d = tc.replace(/\D/g, '');
  if (d.length < 5) return '***********';
  return `${d.slice(0, 3)}*****${d.slice(-2)}`;
}

export function maskIban(iban: string) {
  const clean = iban.replace(/\s/g, '').toUpperCase();
  if (clean.length < 8) return 'TR** ****';
  return `${clean.slice(0, 4)} **** **** ${clean.slice(-4)}`;
}

export function validateTcKimlik(tc: string): boolean {
  const d = tc.replace(/\D/g, '');
  if (!/^\d{11}$/.test(d) || d[0] === '0') return false;
  const digits = d.split('').map(Number);
  const odd = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const even = digits[1] + digits[3] + digits[5] + digits[7];
  const d10 = ((odd * 7 - even) % 10 + 10) % 10;
  if (d10 !== digits[9]) return false;
  const d11 = digits.slice(0, 10).reduce((a, b) => a + b, 0) % 10;
  return d11 === digits[10];
}

export type IdentityType = 'tc' | 'foreign';

export function normalizeIdentityNumber(identityType: IdentityType, value: string): string {
  if (identityType === 'tc') {
    return value.replace(/\D/g, '');
  }
  return value.trim().toUpperCase();
}

export function validateIdentityNumber(identityType: IdentityType, value: string): boolean {
  if (identityType === 'tc') {
    return validateTcKimlik(value);
  }
  const normalized = normalizeIdentityNumber(identityType, value);
  return /^[A-Z0-9]{5,20}$/.test(normalized);
}

export function hashIdentityLookup(identityType: IdentityType, identityNumber: string): string {
  const normalized = normalizeIdentityNumber(identityType, identityNumber);
  if (!validateIdentityNumber(identityType, normalized)) {
    throw new Error('Geçersiz kimlik numarası');
  }
  const secret = process.env.FIELD_ENCRYPTION_KEY;
  if (!secret || secret.length < 16) {
    throw new Error('FIELD_ENCRYPTION_KEY eksik veya çok kısa (.env)');
  }
  return createHmac('sha256', secret)
    .update(`identity-lookup-v1:${identityType}:${normalized}`)
    .digest('hex');
}

export const PLACEHOLDER_IBAN = 'TR000000000000000000000000';

export function normalizeIban(iban: string) {
  return iban.replace(/\s/g, '').toUpperCase();
}

/** Görüntüleme: TR00 0000 0000 … */
export function formatTurkishIbanDisplay(iban: string) {
  const clean = normalizeIban(iban);
  if (!clean) return '';
  return clean.replace(/(.{4})/g, '$1 ').trim();
}

/** Yazarken TR önekini korur; yalnızca rakam (TR sonrası), en fazla 26 karakter */
export function sanitizeTurkishIbanInput(raw: string): string {
  let clean = raw.replace(/\s/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!clean) return '';

  if (!clean.startsWith('TR')) {
    const digits = clean.replace(/\D/g, '');
    clean = digits ? `TR${digits}` : 'TR';
  }

  return `TR${clean.slice(2).replace(/\D/g, '')}`.slice(0, 26);
}

/** Panodan veya yapıştırmadan IBAN çıkarır */
export function parseIbanFromText(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';

  let clean = trimmed.toUpperCase();
  if (clean.startsWith('IBAN')) clean = clean.slice(4).trim();
  clean = clean.replace(/\s/g, '').replace(/[^A-Z0-9]/g, '');

  return sanitizeTurkishIbanInput(clean);
}

export function looksLikeTurkishIban(text: string): boolean {
  const parsed = parseIbanFromText(text);
  return /^TR\d{14,24}$/.test(parsed);
}

/** Telefonu E.164 benzeri normalize eder (yalnız rakam, + olmadan ülke kodu dahil). */
export function normalizePhoneDigits(phone: string): string | null {
  const raw = phone.trim();
  let digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  if (raw.startsWith('00')) {
    digits = digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return `90${digits.slice(1)}`;
  }
  if (digits.length === 10 && digits.startsWith('5')) {
    return `90${digits}`;
  }
  if (digits.length >= 8 && digits.length <= 15) {
    return digits;
  }
  return null;
}

export function validateInternationalPhone(phone: string): boolean {
  const normalized = normalizePhoneDigits(phone);
  return normalized !== null && /^\d{8,15}$/.test(normalized);
}

export function validateTurkishMobilePhone(phone: string): boolean {
  const normalized = normalizePhoneDigits(phone);
  return normalized !== null && /^905\d{9}$/.test(normalized);
}

/** Ulusal numara: 5349685678 → 534 968 5678 */
export function formatTurkishPhoneNational(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}

/** Kayıt/gösterim: +90 534 968 5678 */
export function toStoredTurkishPhone(phoneOrNational: string): string {
  const normalized = normalizePhoneDigits(phoneOrNational);
  if (normalized && normalized.startsWith('90')) {
    return `+90 ${formatTurkishPhoneNational(normalized.slice(2))}`;
  }
  const national = phoneOrNational.replace(/\D/g, '').slice(0, 10);
  if (!national) return '';
  return `+90 ${formatTurkishPhoneNational(national)}`;
}

export function toStoredPhone(phone: string): string {
  const normalized = normalizePhoneDigits(phone);
  if (!normalized) return '';
  if (normalized.startsWith('90')) {
    return `+90 ${formatTurkishPhoneNational(normalized.slice(2))}`;
  }
  return `+${normalized}`;
}

export function extractTurkishNationalDigits(phone: string): string {
  if (!phone?.trim()) return '';
  const normalized = normalizePhoneDigits(phone);
  if (normalized) return normalized.slice(2);
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('90')) digits = digits.slice(2);
  else if (digits.startsWith('0')) digits = digits.slice(1);
  return digits.slice(0, 10);
}

export function hashPhoneLookup(phone: string): string {
  const normalized = normalizePhoneDigits(phone);
  if (!normalized || !/^\d{8,15}$/.test(normalized)) {
    throw new Error('Geçersiz telefon numarası');
  }
  const secret = process.env.FIELD_ENCRYPTION_KEY;
  if (!secret || secret.length < 16) {
    throw new Error('FIELD_ENCRYPTION_KEY eksik veya çok kısa (.env)');
  }
  return createHmac('sha256', secret).update(`phone-lookup-v1:${normalized}`).digest('hex');
}

export function computePhoneLookupHash(phone: string | null | undefined): string | null {
  if (!phone?.trim()) return null;
  try {
    return hashPhoneLookup(phone);
  } catch {
    return null;
  }
}

export function hashIbanLookup(iban: string): string {
  const normalized = normalizeIban(iban);
  if (!validateTurkishIban(normalized)) {
    throw new Error('Geçersiz IBAN');
  }
  const secret = process.env.FIELD_ENCRYPTION_KEY;
  if (!secret || secret.length < 16) {
    throw new Error('FIELD_ENCRYPTION_KEY eksik veya çok kısa (.env)');
  }
  return createHmac('sha256', secret).update(`iban-lookup-v1:${normalized}`).digest('hex');
}

export function computeIbanLookupHash(iban: string | null | undefined): string | null {
  if (!iban?.trim()) return null;
  const normalized = normalizeIban(iban);
  if (normalized === PLACEHOLDER_IBAN) return null;
  try {
    return hashIbanLookup(normalized);
  } catch {
    return null;
  }
}

export function validateTurkishIban(iban: string) {
  const clean = normalizeIban(iban);
  if (!/^TR\d{24}$/.test(clean)) return false;
  const rearranged = clean.slice(4) + clean.slice(0, 4);
  const numeric = rearranged.replace(/[A-Z]/g, (ch) => String(ch.charCodeAt(0) - 55));
  let remainder = 0;
  for (const ch of numeric) {
    remainder = (remainder * 10 + Number(ch)) % 97;
  }
  return remainder === 1;
}
