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
import strings from '@json/src/lib/registration-draft-validation.json';

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
    return strings.nameRequired;
  }
  if (!email) {
    return strings.emailRequired;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return strings.emailInvalid;
  }
  if (!phone) {
    return strings.phoneRequired;
  }
  if (!validateInternationalPhone(phone)) {
    return strings.phoneInvalid;
  }
  if (!identityNumber || !validateIdentityNumber(input.identityType, identityNumber)) {
    return input.identityType === 'tc' ? strings.tcInvalid : strings.foreignIdInvalid;
  }
  if (!input.birthDate) {
    return strings.birthDateRequired;
  }
  if (!isConstructionEligibleBirthDate(input.birthDate)) {
    return constructionAgeErrorMessage();
  }
  if (!iban) {
    return strings.ibanRequired;
  }
  if (!validateTurkishIban(iban)) {
    return strings.ibanInvalid;
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
