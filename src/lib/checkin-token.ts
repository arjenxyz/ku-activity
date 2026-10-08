import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

/**
 * QR payload must contain only this random token — never name, student_no, or registration_no.
 * Persist only the hash in `event_registrations.checkin_token_hash`.
 * Encrypted blob is for student re-display only.
 */
export function generateCheckinToken(): { token: string; tokenHash: string; tokenEncrypted: string } {
  const token = randomBytes(32).toString('base64url');
  return {
    token,
    tokenHash: hashCheckinToken(token),
    tokenEncrypted: encryptCheckinToken(token),
  };
}

export function hashCheckinToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

function encryptionKey() {
  const secret =
    process.env.CHECKIN_TOKEN_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'ems-dev-checkin-secret-change-me';
  return createHash('sha256').update(secret).digest();
}

export function encryptCheckinToken(token: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const enc = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64url');
}

export function decryptCheckinToken(blob: string): string {
  const buf = Buffer.from(blob, 'base64url');
  if (buf.length < 29) throw new Error('Geçersiz token blob');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}
