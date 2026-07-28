'use client';

import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FiCheck, FiChevronDown, FiChevronRight, FiX } from 'react-icons/fi';
import { APP_NAME } from '@/lib/brand';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { flagImageUrl, LOCALE_OPTIONS, type Locale } from '@/lib/i18n/locale';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

type LanguageSwitchProps = {
  className?: string;
  /** compact/pill: tetikleyici + modal; list: ayarlar; nav: mobil menü satırı + modal */
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
  // CSS kutusu küçük; retina için yüksek çözünürlüklü PNG (w20 bulanık kalır)
  const box = size === 'sm' ? 'h-5 w-7 rounded-md' : 'h-7 w-9 rounded-lg';

  return (
    <span
      className={`relative inline-flex shrink-0 overflow-hidden ${box} bg-slate-100 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:ring-slate-700`}
      title={short}
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={flagImageUrl(countryCode, 80)}
        srcSet={`${flagImageUrl(countryCode, 40)} 1x, ${flagImageUrl(countryCode, 80)} 2x`}
        alt=""
        width={40}
        height={30}
        className="h-full w-full object-cover"
        loading="lazy"
        decoding="async"
      />
    </span>
  );
}

function LocaleOptionsList({
  locale,
  onSelect,
}: {
  locale: Locale;
  onSelect: (id: Locale) => void;
}) {
  return (
    <ul
      className="max-h-[min(55vh,18rem)] space-y-0.5 overflow-y-auto overscroll-none p-1.5 [scrollbar-width:thin] [-webkit-overflow-scrolling:touch]"
      role="listbox"
      data-allow-scroll
    >
      {LOCALE_OPTIONS.map((option) => {
        const active = locale === option.id;
        return (
          <li key={option.id}>
            <button
              type="button"
              role="option"
              aria-selected={active}
              onClick={() => onSelect(option.id)}
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
  );
}

function LanguageModal({
  open,
  onClose,
  locale,
  onSelect,
  title,
  footerNote,
  closeButtonAriaLabel,
  closeOverlayAriaLabel,
  titleId,
}: {
  open: boolean;
  onClose: () => void;
  locale: Locale;
  onSelect: (id: Locale) => void;
  title: string;
  footerNote: string;
  closeButtonAriaLabel: string;
  closeOverlayAriaLabel: string;
  titleId: string;
}) {
  const [mounted, setMounted] = useState(false);
  useBodyScrollLock(open);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
            aria-label={closeOverlayAriaLabel}
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-[20rem] overflow-hidden overscroll-none rounded-2xl border border-slate-200/90 bg-white shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40"
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3.5 py-2.5 dark:border-slate-800">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                  {APP_NAME}
                </p>
                <h2
                  id={titleId}
                  className="text-sm font-semibold text-slate-900 dark:text-white"
                >
                  {title}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                aria-label={closeButtonAriaLabel}
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>

            <LocaleOptionsList locale={locale} onSelect={onSelect} />

            <p className="border-t border-slate-100 px-3.5 py-2 text-center text-[10px] leading-snug text-slate-400 dark:border-slate-800 dark:text-slate-500">
              {footerNote}
            </p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}

export function LanguageSwitch({
  className = '',
  variant = 'compact',
  tone = 'default',
}: LanguageSwitchProps) {
  const { locale, setLocale } = useLocale();
  const strings = useRegistryStrings('lib/i18n/locale-ui');
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const current = localeMeta(locale);

  const select = (id: Locale) => {
    setLocale(id);
    setOpen(false);
  };

  const modal = (
    <LanguageModal
      open={open}
      onClose={() => setOpen(false)}
      locale={locale}
      onSelect={select}
      title={strings.modalTitle}
      footerNote={strings.footerNote}
      closeButtonAriaLabel={strings.closeButtonAriaLabel}
      closeOverlayAriaLabel={strings.closeOverlayAriaLabel}
      titleId={titleId}
    />
  );

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
      <>
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-left text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-slate-800 ${className}`}
        >
          <FlagBadge countryCode={current.countryCode} short={current.short} />
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-medium uppercase tracking-wider text-slate-400">
              {strings.menuTitle}
            </span>
            <span className="block text-sm font-medium">{current.nativeLabel}</span>
          </span>
          <FiChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
        </button>
        {modal}
      </>
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
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={strings.switchAriaLabel}
        onClick={() => setOpen(true)}
        className={`inline-flex items-center font-semibold transition-colors ${triggerClass} ${className}`}
      >
        <FlagBadge countryCode={current.countryCode} short={current.short} size="sm" />
        <span className="tracking-wide">{current.short}</span>
        <FiChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
      </button>
      {modal}
    </>
  );
}
