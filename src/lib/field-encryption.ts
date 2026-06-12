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

export function normalizeIban(iban: string) {
  return iban.replace(/\s/g, '').toUpperCase();
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
