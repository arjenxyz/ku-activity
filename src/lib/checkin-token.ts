import { createHash, randomBytes } from 'crypto';

/**
 * QR payload must contain only this random token — never name, student_no, or registration_no.
 * Persist only the hash in `event_registrations.checkin_token_hash`.
 */
export function generateCheckinToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, tokenHash: hashCheckinToken(token) };
}

export function hashCheckinToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}
