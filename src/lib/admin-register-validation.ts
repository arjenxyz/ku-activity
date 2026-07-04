import { validateTurkishMobilePhone } from '@/lib/field-encryption';
import strings from '@json/src/lib/admin-register-validation.json';

export type AdminRegisterInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  jobTitle: string;
  city: string;
  teamSize: string;
  projectCount: string;
  referralSource?: string;
  password: string;
  passwordConfirm: string;
};

export function validateAdminRegister(input: AdminRegisterInput): string | null {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();
  const companyName = input.companyName.trim();
  const jobTitle = input.jobTitle.trim();
  const city = input.city.trim();

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
  if (!validateTurkishMobilePhone(phone)) {
    return strings.phoneInvalid;
  }
  if (!companyName || companyName.length < 2) {
    return strings.companyRequired;
  }
  if (!jobTitle) {
    return strings.jobTitleRequired;
  }
  if (!city || city.length < 2) {
    return strings.cityRequired;
  }
  if (!input.teamSize) {
    return strings.teamSizeRequired;
  }
  if (!input.projectCount) {
    return strings.projectCountRequired;
  }
  if (!input.password || input.password.length < 6) {
    return strings.passwordTooShort;
  }
  if (input.password !== input.passwordConfirm) {
    return strings.passwordMismatch;
  }

  return null;
}
