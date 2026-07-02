'use client';

import { useEffect, useMemo, useState } from 'react';
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

type CountryOption = {
  code: string;
  label: string;
  flag: string;
  sample: string;
  maxLocalDigits: number;
};

const COUNTRY_OPTIONS: CountryOption[] = [
  { code: '90', label: 'Türkiye', flag: '🇹🇷', sample: '5xx xxx xx xx', maxLocalDigits: 10 },
  { code: '49', label: 'Almanya', flag: '🇩🇪', sample: '15x xxx xxxx', maxLocalDigits: 11 },
  { code: '994', label: 'Azerbaycan', flag: '🇦🇿', sample: '50 xxx xx xx', maxLocalDigits: 9 },
  { code: '998', label: 'Özbekistan', flag: '🇺🇿', sample: '90 xxx xx xx', maxLocalDigits: 9 },
  { code: '963', label: 'Suriye', flag: '🇸🇾', sample: '9xx xxx xxx', maxLocalDigits: 9 },
  { code: '995', label: 'Gürcistan', flag: '🇬🇪', sample: '5xx xxx xxx', maxLocalDigits: 9 },
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

function detectCountryByNormalizedDigits(normalized: string): CountryOption | null {
  if (!normalized) return null;
  const sorted = [...COUNTRY_OPTIONS].sort((a, b) => b.code.length - a.code.length);
  return sorted.find((country) => normalized.startsWith(country.code)) ?? null;
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
  const initialCountry = detectCountryByNormalizedDigits(initialNormalized)?.code ?? COUNTRY_OPTIONS[0].code;
  const [countryCode, setCountryCode] = useState(initialCountry);
  const normalized = normalizePhoneDigits(value) ?? '';
  const detectedCountry = detectCountryByNormalizedDigits(normalized);
  const resolvedCountry = detectedCountry?.code ?? countryCode;
  const currentCountry = COUNTRY_OPTIONS.find((c) => c.code === resolvedCountry) ?? COUNTRY_OPTIONS[0];
  const localDigits = normalized.startsWith(resolvedCountry)
    ? normalized.slice(resolvedCountry.length)
    : '';
  const maxLocalDigits = currentCountry.maxLocalDigits;
  const dynamicPlaceholder = currentCountry.sample;
  const countryOptions = useMemo(
    () =>
      COUNTRY_OPTIONS.map((country) => (
        <option key={country.code} value={country.code}>
          {country.flag} {country.label} (+{country.code})
        </option>
      )),
    []
  );

  useEffect(() => {
    if (!allowCountryCodeSelect) return;
    if (detectedCountry?.code && detectedCountry.code !== countryCode) {
      setCountryCode(detectedCountry.code);
    }
  }, [allowCountryCodeSelect, detectedCountry?.code, countryCode]);

  if (allowCountryCodeSelect) {
    return (
      <div
        className={`flex overflow-hidden rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus-within:ring-2 focus-within:ring-blue-500 ${className}`}
      >
        <select
          value={resolvedCountry}
          onChange={(e) => {
            const nextCode = e.target.value;
            setCountryCode(nextCode);
            const nextMax = COUNTRY_OPTIONS.find((c) => c.code === nextCode)?.maxLocalDigits ?? 12;
            const nextLocal = localDigits.replace(/\D/g, '').slice(0, nextMax);
            onChange(nextLocal ? `+${nextCode}${nextLocal}` : '');
          }}
          className="shrink-0 border-r border-gray-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/80 px-2 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
          disabled={disabled}
          aria-label="Ülke kodu"
        >
          {countryOptions}
        </select>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="off"
          disabled={disabled}
          required={required}
          className="min-w-0 flex-1 border-0 bg-transparent px-4 py-3 text-sm tabular-nums tracking-wide focus:outline-none focus:ring-0"
          placeholder={dynamicPlaceholder}
          value={formatIntlLocalDigits(localDigits)}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '').slice(0, maxLocalDigits);
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
