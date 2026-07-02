'use client';

import { useCallback } from 'react';
import {
  formatTurkishIbanDisplay,
  looksLikeTurkishIban,
  normalizeIban,
  parseIbanFromText,
  sanitizeTurkishIbanInput,
} from '@/lib/field-encryption';

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
  id?: string;
  disabled?: boolean;
  placeholder?: string;
};

export function TurkishIbanInput({
  value,
  onChange,
  className = '',
  required,
  id,
  disabled,
  placeholder = 'TR00 0000 0000 0000 0000 0000 00',
}: Props) {
  const cleanValue = normalizeIban(value);
  const displayValue = formatTurkishIbanDisplay(cleanValue);

  const applyValue = useCallback(
    (next: string) => {
      onChange(next ? sanitizeTurkishIbanInput(next) : '');
    },
    [onChange]
  );

  const tryClipboardFill = useCallback(async () => {
    if (cleanValue.length > 2) return;

    try {
      const clip = await navigator.clipboard.readText();
      if (looksLikeTurkishIban(clip)) {
        applyValue(parseIbanFromText(clip));
        return;
      }
    } catch {
      // Panoda okuma izni yoksa sessizce geç
    }

    if (!cleanValue) {
      applyValue('TR');
    }
  }, [applyValue, cleanValue]);

  const handleFocus = () => {
    void tryClipboardFill();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (!raw.trim()) {
      onChange('');
      return;
    }
    applyValue(raw);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    const parsed = parseIbanFromText(text);
    if (parsed) {
      applyValue(parsed);
      return;
    }
    applyValue(text);
  };

  const handleBlur = () => {
    if (cleanValue === 'TR') {
      onChange('');
    }
  };

  return (
    <input
      id={id}
      type="text"
      inputMode="text"
      autoComplete="off"
      autoCapitalize="characters"
      spellCheck={false}
      disabled={disabled}
      required={required}
      className={className}
      placeholder={placeholder}
      value={displayValue}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={handleChange}
      onPaste={handlePaste}
      aria-label="IBAN"
    />
  );
}
