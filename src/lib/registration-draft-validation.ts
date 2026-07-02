import {
  isConstructionEligibleBirthDate,
  constructionAgeErrorMessage,
} from '@/lib/age-validation';
import {
  type IdentityType,
  normalizeIdentityNumber,
  normalizeIban,
  validateIdentityNumber,
  validateTurkishIban,
  validateInternationalPhone,
} from '@/lib/field-encryption';
import { validatePersonnelPin } from '@/lib/personnel-pin';

export type RegistrationDraftFields = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  identityType: IdentityType;
  tcKimlik: string;
  birthDate: string;
  iban: string;
  pin: string;
};

/** Başvuru taslağı alan doğrulaması — hata mesajı veya null */
export function validateRegistrationDraft(input: RegistrationDraftFields): string | null {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();
  const identityNumber = normalizeIdentityNumber(input.identityType, input.tcKimlik);
  const iban = normalizeIban(input.iban);

  if (!firstName || !lastName) {
    return 'Ad ve soyad zorunludur.';
  }
  if (!email) {
    return 'E-posta adresi zorunludur.';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Geçerli bir e-posta adresi girin.';
  }
  if (!phone) {
    return 'Telefon numarası zorunludur.';
  }
  if (!validateInternationalPhone(phone)) {
    return 'Geçerli bir telefon numarası girin (ülke kodu dahil).';
  }
  if (!identityNumber || !validateIdentityNumber(input.identityType, identityNumber)) {
    return input.identityType === 'tc'
      ? 'Geçerli bir T.C. kimlik numarası girin.'
      : 'Geçerli bir yabancı kimlik / pasaport numarası girin.';
  }
  if (!input.birthDate) {
    return 'Doğum tarihi zorunludur.';
  }
  if (!isConstructionEligibleBirthDate(input.birthDate)) {
    return constructionAgeErrorMessage();
  }
  if (!iban) {
    return 'IBAN zorunludur.';
  }
  if (!validateTurkishIban(iban)) {
    return 'Geçerli bir IBAN girin (TR ile 26 karakter, kontrol hanesi doğru olmalı).';
  }
  const pinError = validatePersonnelPin(input.pin);
  if (pinError) {
    return pinError;
  }

  return null;
}

/** E-posta doğrulama modalında gösterilmemesi gereken form alanı hataları */
export function isRegistrationFormFieldError(message: string): boolean {
  return /IBAN|T\.C\.|kimlik|telefon|doğum|PIN|şifre|ad ve soyad|e-posta|kayıtlı|bekleyen başvuru/i.test(
    message
  );
}
