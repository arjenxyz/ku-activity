import strings from '@json/src/lib/personnel-pin.json';
import { formatString } from '@/lib/strings/format';

/** Personel giriş PIN uzunluğu */
export const PERSONNEL_PIN_LENGTH = 6;

/** Personel giriş PIN doğrulama — hata mesajı veya null (geçerli) */
export function validatePersonnelPin(pin: string): string | null {
  const trimmed = pin.trim();
  if (trimmed.length !== PERSONNEL_PIN_LENGTH) {
    return formatString(strings.pinWrongLength, { length: PERSONNEL_PIN_LENGTH });
  }
  if (!/^\d+$/.test(trimmed)) {
    return strings.pinDigitsOnly;
  }
  return null;
}

export function validatePersonnelPinMatch(pin: string, confirm: string): string | null {
  const pinError = validatePersonnelPin(pin);
  if (pinError) return pinError;
  if (pin !== confirm) {
    return strings.pinMismatch;
  }
  return null;
}

/** PIN alanı için yalnızca rakam ve maksimum uzunluk */
export function sanitizePersonnelPinInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, PERSONNEL_PIN_LENGTH);
}
