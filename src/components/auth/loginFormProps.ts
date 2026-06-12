import type { FormHTMLAttributes, InputHTMLAttributes } from 'react';

/** E-posta + şifre girişi (yönetici / developer) */
export const credentialLoginFormProps: FormHTMLAttributes<HTMLFormElement> = {
  autoComplete: 'on',
};

export const loginEmailInputProps: InputHTMLAttributes<HTMLInputElement> = {
  type: 'email',
  name: 'email',
  autoComplete: 'username',
};

export const loginPasswordInputProps: InputHTMLAttributes<HTMLInputElement> = {
  type: 'password',
  name: 'password',
  autoComplete: 'current-password',
};

/** Kayıt / şifre sıfırlama */
export const registerPasswordInputProps: InputHTMLAttributes<HTMLInputElement> = {
  type: 'password',
  name: 'new-password',
  autoComplete: 'new-password',
};

/** T.C. + PIN — web şifresi değil; Google Password Manager tetiklenmesin */
export const personnelLoginFormProps: FormHTMLAttributes<HTMLFormElement> = {
  autoComplete: 'off',
};

export const loginTcInputProps: InputHTMLAttributes<HTMLInputElement> = {
  type: 'text',
  name: 'tc',
  inputMode: 'numeric',
  autoComplete: 'off',
};

export const loginPinInputProps: InputHTMLAttributes<HTMLInputElement> = {
  type: 'text',
  name: 'pin',
  inputMode: 'numeric',
  autoComplete: 'off',
};
