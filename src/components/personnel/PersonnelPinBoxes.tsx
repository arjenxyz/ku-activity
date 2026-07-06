'use client';

import { useEffect, useRef } from 'react';
import { PERSONNEL_PIN_LENGTH } from '@/lib/personnel-pin';

type Props = {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  ariaLabel: string;
};

export function PersonnelPinBoxes({ value, onChange, disabled, autoFocus, ariaLabel }: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: PERSONNEL_PIN_LENGTH }, (_, i) => value[i] ?? '');

  const focusIndex = (index: number) => {
    refs.current[index]?.focus();
    refs.current[index]?.select();
  };

  useEffect(() => {
    if (autoFocus) focusIndex(0);
  }, [autoFocus]);

  const applyDigits = (chars: string[], startIndex = 0) => {
    const next = [...digits];
    chars.forEach((char, offset) => {
      const idx = startIndex + offset;
      if (idx < PERSONNEL_PIN_LENGTH) next[idx] = char;
    });
    onChange(next.join('').replace(/\s/g, ''));
    const lastFilled = Math.min(startIndex + chars.length, PERSONNEL_PIN_LENGTH - 1);
    if (chars.length > 0) focusIndex(lastFilled);
  };

  const handleChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1);
    if (!digit) {
      const next = [...digits];
      next[index] = '';
      onChange(next.join('').trim());
      return;
    }
    applyDigits([digit], index);
    if (index < PERSONNEL_PIN_LENGTH - 1) focusIndex(index + 1);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      e.preventDefault();
      focusIndex(index - 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, PERSONNEL_PIN_LENGTH);
    if (!pasted) return;
    onChange(pasted);
    focusIndex(Math.min(pasted.length, PERSONNEL_PIN_LENGTH) - 1);
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-2.5" onPaste={handlePaste}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          type="password"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-label={`${ariaLabel} ${index + 1}`}
          className="h-12 w-10 sm:h-14 sm:w-12 rounded-xl border border-slate-200 bg-slate-50 text-center text-xl font-bold text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 pin-mask dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
        />
      ))}
    </div>
  );
}
