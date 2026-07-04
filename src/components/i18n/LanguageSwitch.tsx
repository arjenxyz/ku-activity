'use client';

import { useLocalizedStrings } from '@/lib/i18n/useLocalizedStrings';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import type { Locale } from '@/lib/i18n/locale';
import trLocaleUi from '@json/src/lib/i18n/locale-ui.json';
import enLocaleUi from '@json/en/src/lib/i18n/locale-ui.json';

type LanguageSwitchProps = {
  className?: string;
  variant?: 'pill' | 'compact';
  /** Koyu arka plan üzerinde (hero kart vb.) */
  tone?: 'default' | 'onDark';
};

const options: { id: Locale; shortKey: 'trShort' | 'enShort'; labelKey: 'trLabel' | 'enLabel' }[] = [
  { id: 'tr', shortKey: 'trShort', labelKey: 'trLabel' },
  { id: 'en', shortKey: 'enShort', labelKey: 'enLabel' },
];

export function LanguageSwitch({
  className = '',
  variant = 'pill',
  tone = 'default',
}: LanguageSwitchProps) {
  const { locale, setLocale } = useLocale();
  const strings = useLocalizedStrings(trLocaleUi, enLocaleUi);

  const compactShell =
    tone === 'onDark'
      ? 'border-white/20 bg-white/10 backdrop-blur-md'
      : 'border-gray-200/80 dark:border-slate-700/80 bg-gray-50/80 dark:bg-slate-800/60';
  const compactActive =
    tone === 'onDark'
      ? 'bg-white text-[#0E1548] shadow-sm'
      : 'bg-[#0E1548] text-white shadow-sm dark:bg-blue-600';
  const compactInactive =
    tone === 'onDark'
      ? 'text-white/65 hover:text-white'
      : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200';

  if (variant === 'compact') {
    return (
      <div
        className={`inline-flex items-center rounded-xl border p-0.5 ${compactShell} ${className}`}
        role="group"
        aria-label={strings.switchAriaLabel}
      >
        {options.map((option) => {
          const active = locale === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setLocale(option.id)}
              aria-pressed={active}
              aria-label={strings[option.labelKey]}
              className={`min-w-[2.25rem] px-2.5 py-1.5 text-xs font-bold tracking-wide rounded-lg transition-all duration-200 ${
                active ? compactActive : compactInactive
              }`}
            >
              {strings[option.shortKey]}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={`relative inline-flex items-center rounded-2xl border border-gray-200/70 dark:border-slate-700/70 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-1 shadow-sm ${className}`}
      role="group"
      aria-label={strings.switchAriaLabel}
    >
      <span
        aria-hidden
        className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl bg-gradient-to-br from-[#0E1548] to-[#1a237e] dark:from-blue-600 dark:to-indigo-700 shadow-md transition-transform duration-300 ease-out"
        style={{ transform: locale === 'tr' ? 'translateX(4px)' : 'calc(100% + 4px)' }}
      />
      {options.map((option) => {
        const active = locale === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => setLocale(option.id)}
            aria-pressed={active}
            aria-label={strings[option.labelKey]}
            className={`relative z-10 flex items-center gap-1.5 px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-colors duration-200 min-w-[3.5rem] justify-center ${
              active ? 'text-white' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span className="text-[10px] sm:text-xs font-bold opacity-90">{strings[option.shortKey]}</span>
          </button>
        );
      })}
    </div>
  );
}
