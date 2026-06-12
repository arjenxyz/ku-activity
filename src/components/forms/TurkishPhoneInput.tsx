'use client';

import {
  extractTurkishNationalDigits,
  formatTurkishPhoneNational,
  toStoredTurkishPhone,
} from '@/lib/field-encryption';

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
  id?: string;
  disabled?: boolean;
};

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
}: Props) {
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
        placeholder="534 968 5678"
        value={display}
        onChange={handleChange}
        aria-label="Cep telefonu numarası"
      />
    </div>
  );
}
