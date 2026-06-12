/** Personel giriş PIN doğrulama — hata mesajı veya null (geçerli) */
export function validatePersonnelPin(pin: string): string | null {
  const trimmed = pin.trim();
  if (trimmed.length < 4 || trimmed.length > 12) {
    return 'Giriş şifresi (PIN) 4-12 rakam olmalıdır';
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
