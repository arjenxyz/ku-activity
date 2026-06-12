/** Personel giriş PIN uzunluğu */
export const PERSONNEL_PIN_LENGTH = 6;

/** Personel giriş PIN doğrulama — hata mesajı veya null (geçerli) */
export function validatePersonnelPin(pin: string): string | null {
  const trimmed = pin.trim();
  if (trimmed.length !== PERSONNEL_PIN_LENGTH) {
    return `Giriş şifresi (PIN) ${PERSONNEL_PIN_LENGTH} haneli olmalıdır`;
  }
  if (!/^\d+$/.test(trimmed)) {
    return 'PIN yalnızca rakam içermelidir';
  }
  return null;
}

export function validatePersonnelPinMatch(pin: string, confirm: string): string | null {
  const pinError = validatePersonnelPin(pin);
  if (pinError) return pinError;
  if (pin !== confirm) {
    return 'PIN tekrarı eşleşmiyor';
  }
  return null;
}

/** PIN alanı için yalnızca rakam ve maksimum uzunluk */
export function sanitizePersonnelPinInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, PERSONNEL_PIN_LENGTH);
}
