'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ThemeToggleButton } from '@/components/auth/ThemeToggleButton';
import { BrandMark } from '@/components/brand/BrandMark';
import { APP_NAME, APP_TAGLINE_TR } from '@/lib/brand';
import { PLAY_STORE_ADMIN_ICON, PLAY_STORE_PERSONNEL_ICON } from '@/lib/play-store';

const navLinks = [
  { href: '#hero', label: 'Anasayfa' },
  { href: '#features', label: 'Özellikler' },
  { href: '#play-store', label: 'Google Play' },
  { href: '#contact', label: 'İletişim' },
];

const loginPanels = [
  {
    id: 'personel',
    href: '/personnel-panel/login',
    title: 'Personel Paneli',
    headline: 'Sahadayım',
    description: 'Yoklama, yevmiye ve bordro görüntüleme',
    icon: PLAY_STORE_PERSONNEL_ICON,
    cardClass:
      'border-violet-200/80 bg-gradient-to-br from-violet-50/95 via-white to-indigo-50/60 hover:border-violet-300 hover:shadow-md dark:border-violet-900/50 dark:from-violet-950/35 dark:via-slate-900 dark:to-indigo-950/25 dark:hover:border-violet-700',
    titleClass: 'text-slate-900 dark:text-white',
    descClass: 'text-slate-500 dark:text-slate-400',
    badgeClass: 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300',
  },
  {
    id: 'admin',
    href: '/admin-panel/login',
    title: 'Yönetici Paneli',
    headline: 'Yönetiyorum',
    description: 'Proje, personel onayı ve raporlar',
    icon: PLAY_STORE_ADMIN_ICON,
    cardClass:
      'border-blue-200/80 bg-gradient-to-br from-blue-50/95 via-white to-indigo-50/60 hover:border-blue-300 hover:shadow-md dark:border-blue-900/50 dark:from-blue-950/35 dark:via-slate-900 dark:to-indigo-950/25 dark:hover:border-blue-700',
    titleClass: 'text-slate-900 dark:text-white',
    descClass: 'text-slate-500 dark:text-slate-400',
    badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
  },
] as const;

function LoginRolePickerPanel({ onNavigate, compact }: { onNavigate?: () => void; compact?: boolean }) {
  return (
    <div className={compact ? 'space-y-3' : 'space-y-4 p-4 sm:p-5'}>
      {!compact && (
        <div
          className="h-1 rounded-full bg-gradient-to-r from-[#0E1548] via-blue-600 to-indigo-500"
          aria-hidden
        />
      )}

      <div className={compact ? 'px-1' : ''}>
        <p className="text-sm font-bold text-slate-900 dark:text-white">
          Hangi yetki ile giriş yapmak istiyorsunuz?
        </p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          Personel ve yönetici panelleri ayrı giriş ekranlarına yönlendirir.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {loginPanels.map((panel) => (
          <Link
            key={panel.id}
            href={panel.href}
            onClick={onNavigate}
            className={`group flex flex-col rounded-xl border p-3 transition-all active:scale-[0.98] sm:p-3.5 ${panel.cardClass}`}
          >
            <span className={`mb-2 inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${panel.badgeClass}`}>
              {panel.headline}
            </span>
            <span className="relative mx-auto mb-2 h-11 w-11 overflow-hidden rounded-xl shadow-sm ring-1 ring-black/5">
              <Image src={panel.icon} alt="" width={44} height={44} className="h-full w-full object-cover" />
            </span>
            <span className={`text-center text-sm font-bold leading-tight ${panel.titleClass}`}>{panel.title}</span>
            <span className={`mt-1 text-center text-[11px] leading-snug ${panel.descClass}`}>{panel.description}</span>
            <span className="mt-2 flex items-center justify-center gap-1 text-[11px] font-semibold text-blue-600 opacity-0 transition-opacity group-hover:opacity-100 dark:text-blue-400">
              Devam et
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function LoginDropdown({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Giriş menüsünü kapat"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-role-title"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: 'spring', damping: 28, stiffness: 360 }}
            className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(calc(100vw-2rem),400px)] overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40"
          >
            <p id="login-role-title" className="sr-only">
              Hangi yetki ile giriş yapmak istiyorsunuz?
            </p>
            <LoginRolePickerPanel onNavigate={onClose} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function DesktopLoginTrigger() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-blue-500/30"
      >
        Giriş Yap
        <svg
          className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <LoginDropdown open={open} onClose={close} />
    </div>
  );
}

function MobileLoginSection({ onNavigate }: { onNavigate?: () => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="touch-target flex w-full items-center justify-between rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25"
      >
        Giriş Yap
        <svg
          className={`h-4 w-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-800/50"
          >
            <LoginRolePickerPanel
              compact
              onNavigate={() => {
                setExpanded(false);
                onNavigate?.();
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function HomeHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 pt-safe-top ${
          scrolled || isMenuOpen
            ? 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg shadow-sm border-b border-gray-200/60 dark:border-slate-700/60'
            : 'bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm lg:bg-transparent lg:dark:bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 safe-px">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group min-w-0">
              <BrandMark size="sm" className="sm:w-10 sm:h-10" />
              <div className="min-w-0">
                <p className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">{APP_NAME}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate hidden sm:block">
                  {APP_TAGLINE_TR}
                </p>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center space-x-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-2">
              <ThemeToggleButton />
              <DesktopLoginTrigger />
            </div>

            <div className="flex items-center gap-1 md:hidden">
              <ThemeToggleButton />
              <button
                className="touch-target flex flex-col justify-center items-center w-11 h-11 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label={isMenuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
                aria-expanded={isMenuOpen}
              >
                <span
                  className={`bg-blue-600 block transition-all duration-300 h-0.5 w-5 rounded-sm ${
                    isMenuOpen ? 'rotate-45 translate-y-1' : '-translate-y-0.5'
                  }`}
                />
                <span
                  className={`bg-blue-600 block transition-all duration-300 h-0.5 w-5 rounded-sm my-1 ${
                    isMenuOpen ? 'opacity-0' : 'opacity-100'
                  }`}
                />
                <span
                  className={`bg-blue-600 block transition-all duration-300 h-0.5 w-5 rounded-sm ${
                    isMenuOpen ? '-rotate-45 -translate-y-1' : 'translate-y-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${
          isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!isMenuOpen}
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setIsMenuOpen(false)}
        />
        <nav
          className={`absolute top-0 right-0 h-full w-[min(100%,320px)] bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-300 safe-pt safe-pb ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full p-5 pt-16">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">Menü</p>
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="touch-target flex items-center text-gray-700 dark:text-gray-200 font-medium py-3.5 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 active:bg-blue-50 dark:active:bg-blue-900/20"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-auto pt-4 border-t border-gray-200 dark:border-slate-700">
              <MobileLoginSection onNavigate={() => setIsMenuOpen(false)} />
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}
