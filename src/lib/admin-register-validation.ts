import { validateTurkishMobilePhone } from '@/lib/field-encryption';

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
  if (!validateTurkishMobilePhone(phone)) {
    return 'Geçerli bir cep telefonu girin (ör. 534 968 5678).';
  }
  if (!companyName || companyName.length < 2) {
    return 'Firma veya şantiye adı zorunludur.';
  }
  if (!jobTitle) {
    return 'Görev / unvan seçin.';
  }
  if (!city || city.length < 2) {
    return 'Şehir bilgisi zorunludur.';
  }
  if (!input.teamSize) {
    return 'Tahmini personel sayısını seçin.';
  }
  if (!input.projectCount) {
    return 'Aktif şantiye sayısını seçin.';
  }
  if (!input.password || input.password.length < 6) {
    return 'Şifre en az 6 karakter olmalıdır.';
  }
  if (input.password !== input.passwordConfirm) {
    return 'Şifreler eşleşmiyor.';
  }

  return null;
}
