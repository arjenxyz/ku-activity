'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiCheck, FiChevronRight } from 'react-icons/fi';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { flagImageUrl, LOCALE_OPTIONS, type Locale } from '@/lib/i18n/locale';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

const MENU_LOCALES = LOCALE_OPTIONS.filter((option) => option.id === 'tr' || option.id === 'en');

function FlagBadge({ countryCode, short }: { countryCode: string; short: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className="inline-flex h-7 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[9px] font-bold text-slate-600 ring-1 ring-slate-200">
        {short}
      </span>
    );
  }
  return (
    <span className="relative inline-flex h-7 w-9 shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={flagImageUrl(countryCode, 80)}
        alt=""
        className="h-full w-full object-cover"
        onError={() => setFailed(true)}
      />
    </span>
  );
}

export function LanguageSwitch({ variant = 'nav' }: { variant?: 'nav' | 'compact' }) {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const current = MENU_LOCALES.find((option) => option.id === locale) ?? MENU_LOCALES[0];

  useBodyScrollLock(open);

  useEffect(() => setMounted(true), []);

  const select = (id: Locale) => {
    setLocale(id);
    setOpen(false);
  };

  const overlay =
    mounted && open
      ? createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Dil"
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 px-4 backdrop-blur-md"
            onClick={() => setOpen(false)}
          >
            <div
              className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-900/10"
              onClick={(event) => event.stopPropagation()}
            >
              <p className="px-1 pb-3 text-sm font-semibold text-[#0E1548]">Dil</p>
              <div className="grid gap-2">
              {MENU_LOCALES.map((option) => {
                const active = option.id === locale;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => select(option.id)}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-left ${
                      active
                        ? 'bg-[#0E1548]/[0.06] text-[#0E1548] ring-1 ring-[#0E1548]/15'
                        : 'text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <FlagBadge countryCode={option.countryCode} short={option.short} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{option.nativeLabel}</span>
                      <span className="block text-[11px] text-slate-500">{option.englishName}</span>
                    </span>
                    {active ? <FiCheck className="h-4 w-4 shrink-0 text-[#0E1548]" /> : null}
                  </button>
                );
              })}
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  if (variant === 'compact') {
    return (
      <>
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label="Dil"
          onClick={() => setOpen(true)}
          className="flex h-10 items-center gap-2 rounded-xl px-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <FlagBadge countryCode={current.countryCode} short={current.short} />
          <span>{current.short}</span>
        </button>
        {overlay}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-left text-slate-700 hover:bg-slate-50"
      >
        <FlagBadge countryCode={current.countryCode} short={current.short} />
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-medium uppercase tracking-wider text-slate-400">Dil</span>
          <span className="block text-sm font-medium">{current.nativeLabel}</span>
        </span>
        <FiChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
      </button>
      {overlay}
    </>
  );
}
