import bcrypt from 'bcryptjs';
import { decryptField, encryptField } from '@/lib/field-encryption';

export async function buildEmployeePinFields(pin: string) {
  const normalized = pin.trim();
  return {
    pin_hash: await bcrypt.hash(normalized, 12),
    pin_encrypted: encryptField(normalized),
  };
}

export function decryptEmployeePinForAdmin(pinEncrypted: string | null | undefined): string | null {
  if (!pinEncrypted) return null;
  try {
    return decryptField(pinEncrypted);
  } catch {
    return null;
  }
}
