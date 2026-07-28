'use client';

import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FiCheck, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { BrandMark } from '@/components/brand/BrandMark';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { flagImageUrl, LOCALE_OPTIONS, type Locale } from '@/lib/i18n/locale';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

type LanguageSwitchProps = {
  className?: string;
  /** compact/pill: tetikleyici + tam ekran blur katmanı; list: ayarlar; nav: mobil menü satırı + blur katmanı */
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
  const [failed, setFailed] = useState(false);
  const box = size === 'sm' ? 'h-5 w-7 rounded-md' : 'h-7 w-9 rounded-lg';

  if (failed) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center bg-slate-100 text-[9px] font-bold uppercase text-slate-600 ring-1 ring-slate-200/80 ${box}`}
        title={short}
        aria-hidden
      >
        {short}
      </span>
    );
  }

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
        onError={() => setFailed(true)}
      />
    </span>
  );
}

function LocaleOptionTile({
  option,
  active,
  onSelect,
  layout = 'list',
}: {
  option: (typeof LOCALE_OPTIONS)[number];
  active: boolean;
  onSelect: (id: Locale) => void;
  layout?: 'list' | 'overlay';
}) {
  const overlayItemClass = active
    ? 'bg-white/95 text-[#0E1548] shadow-lg shadow-slate-900/10 ring-2 ring-white/80'
    : 'bg-white/80 text-slate-800 hover:bg-white/95';

  const listItemClass = active
    ? 'bg-[#0E1548]/[0.06] text-[#0E1548] dark:bg-blue-500/15 dark:text-blue-100'
    : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/80';

  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onClick={() => onSelect(option.id)}
      className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left transition-all ${
        layout === 'overlay' ? overlayItemClass : listItemClass
      }`}
    >
      <FlagBadge countryCode={option.countryCode} short={option.short} />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold leading-tight">{option.nativeLabel}</span>
        <span
          className={`block text-[11px] ${
            layout === 'overlay' ? 'text-slate-500' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {option.englishName}
        </span>
      </span>
      {active ? (
        <FiCheck
          className={`h-4 w-4 shrink-0 ${
            layout === 'overlay' ? 'text-[#0E1548]' : 'text-[#0E1548] dark:text-blue-300'
          }`}
        />
      ) : (
        <span className="h-4 w-4 shrink-0" aria-hidden />
      )}
    </button>
  );
}

function LocaleOptionsList({
  locale,
  onSelect,
  layout = 'list',
  scrollable = true,
}: {
  locale: Locale;
  onSelect: (id: Locale) => void;
  layout?: 'list' | 'overlay';
  scrollable?: boolean;
}) {
  const listClass =
    layout === 'overlay'
      ? 'grid grid-cols-1 gap-2 sm:grid-cols-2'
      : 'max-h-[min(55vh,18rem)] space-y-0.5 overflow-y-auto overscroll-none p-1.5 [scrollbar-width:thin] [-webkit-overflow-scrolling:touch]';

  return (
    <ul
      className={listClass}
      role="listbox"
      {...(scrollable ? { 'data-allow-scroll': true } : {})}
    >
      {LOCALE_OPTIONS.map((option) => (
        <li key={option.id}>
          <LocaleOptionTile
            option={option}
            active={locale === option.id}
            onSelect={onSelect}
            layout={layout}
          />
        </li>
      ))}
    </ul>
  );
}

function LanguageOverlay({
  open,
  onClose,
  locale,
  onSelect,
  title,
  exitHint,
  footerNote,
  closeOverlayAriaLabel,
  titleId,
}: {
  open: boolean;
  onClose: () => void;
  locale: Locale;
  onSelect: (id: Locale) => void;
  title: string;
  exitHint: string;
  footerNote: string;
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
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="fixed inset-0 z-[100] flex h-[100dvh] flex-col bg-slate-900/65 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
        >
          <button
            type="button"
            className="sr-only"
            aria-label={closeOverlayAriaLabel}
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="flex h-full min-h-0 flex-col"
          >
            <div
              className="mx-auto min-h-0 w-full max-w-5xl flex-1 overflow-y-auto overscroll-contain px-3 pb-8 [-webkit-overflow-scrolling:touch] [scrollbar-gutter:stable] sm:px-4"
              data-allow-scroll
              onClick={(e) => e.stopPropagation()}
            >
              <header
                className="safe-pt sticky top-0 z-10 -mx-3 bg-transparent px-3 pb-2 sm:-mx-4 sm:px-4"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-14 w-full items-center gap-2.5 rounded-2xl border border-white/80 bg-white/95 px-3 text-left shadow-lg shadow-slate-900/10 backdrop-blur-xl transition-opacity hover:opacity-90 active:opacity-80 sm:px-4"
                  aria-label={closeOverlayAriaLabel}
                >
                  <BrandMark size="sm" className="shrink-0 shadow-md ring-2 ring-slate-200/80" />
                  <div className="min-w-0">
                    <p
                      id={titleId}
                      className="truncate text-[13px] font-bold leading-tight tracking-[0.08em] text-[#0E1548]"
                    >
                      {title}
                    </p>
                    <p className="truncate text-[10px] font-medium leading-tight text-slate-500">
                      {exitHint}
                    </p>
                  </div>
                </button>
              </header>

              <LocaleOptionsList
                locale={locale}
                onSelect={onSelect}
                layout="overlay"
                scrollable={false}
              />
            </div>

            <p className="sr-only">{footerNote}</p>
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

  const overlay = (
    <LanguageOverlay
      open={open}
      onClose={() => setOpen(false)}
      locale={locale}
      onSelect={select}
      title={strings.modalTitle}
      exitHint={strings.exitHint}
      footerNote={strings.footerNote}
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
        {overlay}
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
      {overlay}
    </>
  );
}
