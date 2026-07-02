'use client';

import { useState } from 'react';
import {
  extractTurkishNationalDigits,
  formatTurkishPhoneNational,
  normalizePhoneDigits,
  toStoredTurkishPhone,
} from '@/lib/field-encryption';

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
  id?: string;
  disabled?: boolean;
  placeholder?: string;
  allowCountryCodeSelect?: boolean;
};

const COUNTRY_OPTIONS = [
  { code: '90', label: 'TR +90' },
  { code: '49', label: 'DE +49' },
  { code: '994', label: 'AZ +994' },
  { code: '998', label: 'UZ +998' },
  { code: '963', label: 'SY +963' },
  { code: '995', label: 'GE +995' },
];

function formatIntlLocalDigits(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 15);
  if (!d) return '';
  const parts: string[] = [];
  for (let i = 0; i < d.length; i += 3) {
    parts.push(d.slice(i, i + 3));
  }
  return parts.join(' ');
}

/** Ulusal alan — kullanıcı 90 / 0 / +90 yazsa da sadece 10 haneli numara kalır */
function parseInputDigits(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('90')) {
    digits = digits.slice(2);
  } else if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits.slice(0, 10);
}

export function TurkishPhoneInput({
  value,
  onChange,
  className = '',
  required,
  id,
  disabled,
  placeholder = '5xx xxx xx xx',
  allowCountryCodeSelect = false,
}: Props) {
  const initialNormalized = normalizePhoneDigits(value) ?? '';
  const initialCountry =
    COUNTRY_OPTIONS.find((c) => initialNormalized.startsWith(c.code))?.code ?? COUNTRY_OPTIONS[0].code;
  const [countryCode, setCountryCode] = useState(initialCountry);

  if (allowCountryCodeSelect) {
    const normalized = normalizePhoneDigits(value) ?? '';
    const resolvedCountry =
      COUNTRY_OPTIONS.find((c) => normalized.startsWith(c.code))?.code ?? countryCode;
    const localDigits = normalized.startsWith(resolvedCountry)
      ? normalized.slice(resolvedCountry.length)
      : '';

    return (
      <div
        className={`flex overflow-hidden rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus-within:ring-2 focus-within:ring-blue-500 ${className}`}
      >
        <select
          value={resolvedCountry}
          onChange={(e) => {
            const nextCode = e.target.value;
            setCountryCode(nextCode);
            const nextLocal = localDigits.replace(/\D/g, '').slice(0, 15 - nextCode.length);
            onChange(nextLocal ? `+${nextCode}${nextLocal}` : '');
          }}
          className="shrink-0 border-r border-gray-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/80 px-2 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
          disabled={disabled}
          aria-label="Ülke kodu"
        >
          {COUNTRY_OPTIONS.map((country) => (
            <option key={country.code} value={country.code}>
              {country.label}
            </option>
          ))}
        </select>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="off"
          disabled={disabled}
          required={required}
          className="min-w-0 flex-1 border-0 bg-transparent px-4 py-3 text-sm tabular-nums tracking-wide focus:outline-none focus:ring-0"
          placeholder="123 456 789"
          value={formatIntlLocalDigits(localDigits)}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '').slice(0, 15 - resolvedCountry.length);
            onChange(digits ? `+${resolvedCountry}${digits}` : '');
          }}
          aria-label="Telefon numarası"
        />
      </div>
    );
  }

  const national = extractTurkishNationalDigits(value);
  const display = formatTurkishPhoneNational(national);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = parseInputDigits(e.target.value);
    if (!digits) {
      onChange('');
      return;
    }
    // 905… yazımı 90 kırpıldıktan sonra 5 ile devam eder; geçersiz önekte sıfırla (mobilde silme)
    if (digits[0] !== '5') {
      onChange('');
      return;
    }
    onChange(toStoredTurkishPhone(digits));
  };

  return (
    <div
      className={`flex overflow-hidden rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus-within:ring-2 focus-within:ring-blue-500 ${className}`}
    >
      <div
        className="flex shrink-0 items-center gap-1.5 border-r border-gray-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/80 px-3 py-3"
        aria-hidden
      >
        <span className="text-base leading-none" role="img" aria-label="Türkiye">
          🇹🇷
        </span>
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
          +90
        </span>
      </div>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="off"
        disabled={disabled}
        required={required}
        className="min-w-0 flex-1 border-0 bg-transparent px-4 py-3 text-sm tabular-nums tracking-wide focus:outline-none focus:ring-0"
        placeholder={placeholder}
        value={display}
        onChange={handleChange}
        aria-label="Cep telefonu numarası"
      />
    </div>
  );
}
