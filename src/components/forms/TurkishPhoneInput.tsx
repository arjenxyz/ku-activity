'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
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

import { getRegistryStrings } from '@/lib/i18n/strings-registry';

type PhoneStrings = ReturnType<typeof getRegistryStrings<'components/forms/TurkishPhoneInput'>>;

const COUNTRY_META = [
  { code: '90', flag: '🇹🇷', sample: '5xx xxx xxxx', maxLocalDigits: 10 },
  { code: '49', flag: '🇩🇪', sample: '15x xxx xxxx', maxLocalDigits: 11 },
  { code: '994', flag: '🇦🇿', sample: '50 xxx xx xx', maxLocalDigits: 9 },
  { code: '998', flag: '🇺🇿', sample: '90 xxx xx xx', maxLocalDigits: 9 },
  { code: '963', flag: '🇸🇾', sample: '9xx xxx xxx', maxLocalDigits: 9 },
  { code: '995', flag: '🇬🇪', sample: '5xx xxx xxx', maxLocalDigits: 9 },
] as const;

function buildCountryOptions(strings: PhoneStrings): CountryOption[] {
  return COUNTRY_META.map((meta) => ({
    ...meta,
    label: strings.countries[meta.code as keyof typeof strings.countries],
  }));
}

function formatIntlLocalDigits(digits: string, countryCode?: string): string {
  if (countryCode === '90') {
    return formatTurkishPhoneNational(digits);
  }
  const d = digits.replace(/\D/g, '').slice(0, 15);
  if (!d) return '';
  const parts: string[] = [];
  for (let i = 0; i < d.length; i += 3) {
    parts.push(d.slice(i, i + 3));
  }
  return parts.join(' ');
}

const phoneFieldClass =
  'personnel-auth-input min-w-0 flex-1 border-0 bg-slate-50 px-2.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 tabular-nums tracking-wide focus:outline-none focus:ring-0 focus:bg-white';

const phoneWrapClass =
  'flex overflow-hidden rounded-xl border border-slate-200 bg-slate-50 focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-500 focus-within:bg-white [color-scheme:light]';

function detectCountryByNormalizedDigits(
  normalized: string,
  countryOptions: CountryOption[]
): CountryOption | null {
  if (!normalized) return null;
  const sorted = [...countryOptions].sort((a, b) => b.code.length - a.code.length);
  return sorted.find((country) => normalized.startsWith(country.code)) ?? null;
}

function parseStoredIntlPhone(
  value: string,
  fallbackCountry: string,
  countryOptions: CountryOption[]
): { countryCode: string; localDigits: string } {
  const digits = value.replace(/\D/g, '');
  if (!digits) return { countryCode: fallbackCountry, localDigits: '' };

  const detected = detectCountryByNormalizedDigits(digits, countryOptions);
  const countryCode = detected?.code ?? fallbackCountry;
  const localDigits = digits.startsWith(countryCode) ? digits.slice(countryCode.length) : digits;
  return { countryCode, localDigits };
}

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
  placeholder,
  allowCountryCodeSelect = false,
}: Props) {
  const strings = useRegistryStrings('components/forms/TurkishPhoneInput');
  const countryOptions = useMemo(() => buildCountryOptions(strings), [strings]);
  const resolvedPlaceholder = placeholder ?? strings.defaultPlaceholder;

  const initialNormalized = normalizePhoneDigits(value) ?? '';
  const initialCountry =
    detectCountryByNormalizedDigits(initialNormalized, countryOptions)?.code ?? countryOptions[0].code;
  const [countryCode, setCountryCode] = useState(initialCountry);
  const parsedIntl = parseStoredIntlPhone(value, countryCode, countryOptions);
  const resolvedCountry = parsedIntl.countryCode;
  const localDigits = parsedIntl.localDigits;
  const currentCountry = countryOptions.find((c) => c.code === resolvedCountry) ?? countryOptions[0];
  const maxLocalDigits = currentCountry.maxLocalDigits;
  const dynamicPlaceholder = currentCountry.sample;
  const countrySelectOptions = useMemo(
    () =>
      countryOptions.map((country) => (
        <option key={country.code} value={country.code} title={country.label}>
          {country.flag} +{country.code}
        </option>
      )),
    [countryOptions]
  );

  useEffect(() => {
    if (!allowCountryCodeSelect) return;
    if (parsedIntl.countryCode && parsedIntl.countryCode !== countryCode) {
      setCountryCode(parsedIntl.countryCode);
    }
  }, [allowCountryCodeSelect, parsedIntl.countryCode, countryCode]);

  if (allowCountryCodeSelect) {
    return (
      <div className={`${phoneWrapClass} ${className}`}>
        <select
          value={resolvedCountry}
          onChange={(e) => {
            const nextCode = e.target.value;
            setCountryCode(nextCode);
            const nextMax = countryOptions.find((c) => c.code === nextCode)?.maxLocalDigits ?? 12;
            const nextLocal = localDigits.replace(/\D/g, '').slice(0, nextMax);
            onChange(nextLocal ? `+${nextCode}${nextLocal}` : '');
          }}
          className="personnel-auth-input w-[4.25rem] shrink-0 border-r border-slate-200 bg-slate-100 pl-1.5 pr-0.5 py-2.5 text-xs font-semibold text-slate-900 appearance-none text-center [color-scheme:light]"
          disabled={disabled}
          aria-label={strings.countryCodeAriaLabel}
        >
          {countrySelectOptions}
        </select>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          disabled={disabled}
          required={required}
          className={phoneFieldClass}
          placeholder={dynamicPlaceholder}
          value={formatIntlLocalDigits(localDigits, resolvedCountry)}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '').slice(0, maxLocalDigits);
            onChange(digits ? `+${resolvedCountry}${digits}` : '');
          }}
          aria-label={strings.phoneAriaLabel}
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
    if (digits[0] !== '5') {
      onChange('');
      return;
    }
    onChange(toStoredTurkishPhone(digits));
  };

  return (
    <div className={`${phoneWrapClass} ${className}`}>
      <div
        className="flex shrink-0 items-center gap-1.5 border-r border-slate-200 bg-slate-100 px-3 py-3"
        aria-hidden
      >
        <span className="text-base leading-none" role="img" aria-label={strings.turkeyAriaLabel}>
          🇹🇷
        </span>
        <span className="text-sm font-semibold text-slate-900 tabular-nums">+90</span>
      </div>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="off"
        disabled={disabled}
        required={required}
        className={`${phoneFieldClass} px-4 py-3`}
        placeholder={resolvedPlaceholder}
        value={display}
        onChange={handleChange}
        aria-label={strings.mobileAriaLabel}
      />
    </div>
  );
}
