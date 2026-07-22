'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { FiCheck, FiChevronDown } from 'react-icons/fi';
import { useLocalizedStrings } from '@/lib/i18n/useLocalizedStrings';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { flagImageUrl, LOCALE_OPTIONS, type Locale } from '@/lib/i18n/locale';
import trLocaleUi from '@json/src/lib/i18n/locale-ui.json';
import enLocaleUi from '@json/en/src/lib/i18n/locale-ui.json';

type LanguageSwitchProps = {
  className?: string;
  /** compact/pill: dropdown; list: ayarlar; nav: mobil menü satırı */
  variant?: 'pill' | 'compact' | 'list' | 'nav';
  /** Koyu arka plan üzerinde (hero kart vb.) */
  tone?: 'default' | 'onDark';
};

function localeMeta(id: Locale) {
  return LOCALE_OPTIONS.find((o) => o.id === id) ?? LOCALE_OPTIONS[0];
}

function FlagBadge({
  countryCode,
  short,
  size = 'md',
}: {
  countryCode: string;
  short: string;
  size?: 'sm' | 'md';
}) {
  const box = size === 'sm' ? 'h-5 w-7 rounded-md' : 'h-7 w-9 rounded-lg';
  // flagcdn: yalnızca 20 / 40 / 80… — sm için 20, md için 40
  const imgW = size === 'sm' ? 20 : 40;

  return (
    <span
      className={`relative inline-flex shrink-0 overflow-hidden ${box} bg-slate-100 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:ring-slate-700`}
      title={short}
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={flagImageUrl(countryCode, imgW)}
        alt=""
        width={imgW}
        height={Math.round(imgW * 0.75)}
        className="h-full w-full object-cover"
        loading="lazy"
        decoding="async"
      />
    </span>
  );
}

export function LanguageSwitch({
  className = '',
  variant = 'compact',
  tone = 'default',
}: LanguageSwitchProps) {
  const { locale, setLocale } = useLocale();
  const strings = useLocalizedStrings(trLocaleUi, enLocaleUi);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const current = localeMeta(locale);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const select = (id: Locale) => {
    setLocale(id);
    setOpen(false);
  };

  if (variant === 'list') {
    return (
      <div
        className={`flex flex-col gap-1 ${className}`}
        role="listbox"
        aria-label={strings.switchAriaLabel}
      >
        {LOCALE_OPTIONS.map((option) => {
          const active = locale === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="option"
              aria-selected={active}
              onClick={() => select(option.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                active
                  ? 'bg-[#0E1548]/[0.06] text-[#0E1548] ring-1 ring-[#0E1548]/15 dark:bg-blue-500/15 dark:text-blue-100 dark:ring-blue-400/25'
                  : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/80'
              }`}
            >
              <FlagBadge countryCode={option.countryCode} short={option.short} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold leading-tight">{option.nativeLabel}</span>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                  {option.englishName}
                </span>
              </span>
              {active ? <FiCheck className="h-4 w-4 shrink-0 text-[#0E1548] dark:text-blue-300" /> : null}
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'nav') {
    return (
      <div ref={rootRef} className={`w-full ${className}`}>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-left text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-slate-800"
        >
          <FlagBadge countryCode={current.countryCode} short={current.short} />
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-medium uppercase tracking-wider text-slate-400">
              {strings.menuTitle}
            </span>
            <span className="block text-sm font-medium">{current.nativeLabel}</span>
          </span>
          <FiChevronDown
            className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>
        {open ? (
          <div
            id={menuId}
            role="listbox"
            aria-label={strings.switchAriaLabel}
            className="mt-1 grid max-h-[min(42vh,16rem)] grid-cols-2 gap-1 overflow-y-auto overscroll-contain px-1 pb-1 [scrollbar-width:thin]"
          >
            {LOCALE_OPTIONS.map((option) => {
              const active = locale === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => select(option.id)}
                  className={`flex min-w-0 items-center gap-2 rounded-xl px-2.5 py-2.5 text-left text-sm transition-colors ${
                    active
                      ? 'bg-[#0E1548]/[0.08] font-semibold text-[#0E1548] dark:bg-blue-500/15 dark:text-blue-200'
                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <FlagBadge countryCode={option.countryCode} short={option.short} size="sm" />
                  <span className="min-w-0 flex-1 truncate">{option.nativeLabel}</span>
                  {active ? (
                    <FiCheck className="h-3.5 w-3.5 shrink-0 text-[#0E1548] dark:text-blue-300" />
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    );
  }

  const onDark = tone === 'onDark';
  const triggerClass =
    variant === 'pill'
      ? onDark
        ? 'min-h-11 gap-2 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white backdrop-blur-md hover:bg-white/15'
        : 'min-h-11 gap-2 rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800'
      : onDark
        ? 'h-9 gap-1.5 rounded-xl border border-white/20 bg-white/10 px-2.5 text-xs text-white backdrop-blur-md hover:bg-white/15'
        : 'h-9 gap-1.5 rounded-xl border border-slate-200/80 bg-white/90 px-2.5 text-xs text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800';

  return (
    <div ref={rootRef} className={`relative inline-flex ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={strings.switchAriaLabel}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center font-semibold transition-colors ${triggerClass}`}
      >
        <FlagBadge countryCode={current.countryCode} short={current.short} size="sm" />
        <span className="tracking-wide">{current.short}</span>
        <FiChevronDown
          className={`h-3.5 w-3.5 shrink-0 opacity-60 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          id={menuId}
          role="listbox"
          aria-label={strings.menuTitle}
          className="absolute right-0 top-[calc(100%+0.4rem)] z-[80] min-w-[15rem] overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_12px_40px_rgba(14,21,72,0.12)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40"
        >
          <div className="border-b border-slate-100 px-3.5 py-2.5 dark:border-slate-800">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
              {strings.menuTitle}
            </p>
          </div>
          <ul className="max-h-72 overflow-y-auto p-1.5 [scrollbar-width:thin]">
            {LOCALE_OPTIONS.map((option) => {
              const active = locale === option.id;
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => select(option.id)}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors ${
                      active
                        ? 'bg-[#0E1548]/[0.06] text-[#0E1548] dark:bg-blue-500/15 dark:text-blue-100'
                        : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <FlagBadge countryCode={option.countryCode} short={option.short} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold leading-tight">{option.nativeLabel}</span>
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                        {option.englishName}
                      </span>
                    </span>
                    {active ? (
                      <FiCheck className="h-3.5 w-3.5 shrink-0 text-[#0E1548] dark:text-blue-300" />
                    ) : (
                      <span className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
