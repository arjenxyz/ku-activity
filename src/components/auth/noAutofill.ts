import type { FormHTMLAttributes, InputHTMLAttributes } from 'react';

export const noAutofillFormProps: FormHTMLAttributes<HTMLFormElement> = {
  autoComplete: 'off',
};

const clearReadonlyOnFocus: InputHTMLAttributes<HTMLInputElement>['onFocus'] = (e) => {
  e.currentTarget.removeAttribute('readonly');
};

export const noAutofillTextProps = {
  autoComplete: 'off',
  'data-lpignore': 'true',
  'data-1p-ignore': 'true',
  'data-bwignore': 'true',
  readOnly: true,
  onFocus: clearReadonlyOnFocus,
} as InputHTMLAttributes<HTMLInputElement>;

export const noAutofillEmailProps: InputHTMLAttributes<HTMLInputElement> = {
  ...noAutofillTextProps,
  type: 'text',
  inputMode: 'email',
};

export const noAutofillPasswordProps = {
  autoComplete: 'new-password',
  'data-lpignore': 'true',
  'data-1p-ignore': 'true',
  'data-bwignore': 'true',
  readOnly: true,
  onFocus: clearReadonlyOnFocus,
} as InputHTMLAttributes<HTMLInputElement>;

export const noAutofillTelProps: InputHTMLAttributes<HTMLInputElement> = {
  ...noAutofillTextProps,
  type: 'tel',
  inputMode: 'tel',
};
