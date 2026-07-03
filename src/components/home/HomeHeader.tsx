'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggleButton } from '@/components/auth/ThemeToggleButton';
import { BrandMark } from '@/components/brand/BrandMark';
import { APP_NAME, APP_TAGLINE_TR } from '@/lib/brand';

const navLinks = [
  {
    href: '#hero',
    sectionId: 'hero',
    label: 'Anasayfa',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    ),
  },
  {
    href: '#features',
    sectionId: 'features',
    label: 'Özellikler',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
      />
    ),
  },
  {
    href: '#play-store',
    sectionId: 'play-store',
    label: 'Mobil Uygulama',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
      />
    ),
  },
  {
    href: '#contact',
    sectionId: 'contact',
    label: 'İletişim',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    ),
  },
] as const;

const sectionIds = navLinks.map((link) => link.sectionId);

function NavIcon({ children }: { children: ReactNode }) {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      {children}
    </svg>
  );
}

function useActiveSection() {
  const [active, setActive] = useState<string>(sectionIds[0]);

  useEffect(() => {
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        const top = visible[0]?.target.id;
        if (top) setActive(top);
      },
      { rootMargin: '-35% 0px -50% 0px', threshold: [0, 0.15, 0.35, 0.55, 0.75] },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return active;
}

export function HomeHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const activeSection = useActiveSection();

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isMenuOpen, closeMenu]);

  const headerSolid = scrolled || isMenuOpen;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 pt-safe-top transition-all duration-300 ${
          headerSolid
            ? 'border-b border-slate-200/70 bg-white/95 shadow-sm backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-950/95'
            : 'bg-white/70 backdrop-blur-md dark:bg-slate-950/70 lg:bg-transparent lg:backdrop-blur-none lg:dark:bg-transparent'
        }`}
      >
        {headerSolid && (
          <div
            className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-[#0E1548] via-blue-600 to-indigo-500"
            aria-hidden
          />
        )}

        <div className="mx-auto max-w-7xl px-4 safe-px sm:px-6 lg:px-8">
          <div className="grid h-[4.25rem] grid-cols-[1fr_auto] items-center gap-3 sm:h-[4.5rem] lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
            <Link href="/" className="group flex min-w-0 items-center gap-2.5 sm:gap-3">
              <BrandMark size="sm" className="sm:h-10 sm:w-10" />
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-slate-900 dark:text-white sm:text-lg">{APP_NAME}</p>
                <p className="hidden truncate text-[11px] text-slate-500 dark:text-slate-400 sm:block">{APP_TAGLINE_TR}</p>
              </div>
            </Link>

            <nav
              className="hidden items-center gap-1 rounded-2xl border border-slate-200/80 bg-white/80 p-1 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/80 lg:flex"
              aria-label="Ana menü"
            >
              {navLinks.map((link) => {
                const isActive = activeSection === link.sectionId;
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    aria-current={isActive ? 'true' : undefined}
                    className={`relative rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                      isActive
                        ? 'text-white'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="nav-active-pill"
                        className="absolute inset-0 rounded-xl bg-[#0E1548] shadow-sm dark:bg-[#151d5c]"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                    <span className="relative">{link.label}</span>
                  </a>
                );
              })}
            </nav>

            <div className="hidden items-center justify-end gap-1.5 lg:flex">
              <ThemeToggleButton />
              <Link
                href="/personnel-panel/login"
                className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                Personel
              </Link>
              <Link
                href="/admin-panel/register"
                className="rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-800"
              >
                Kayıt Ol
              </Link>
              <Link
                href="/admin-panel/login"
                className="rounded-xl bg-[#0E1548] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#0E1548]/20 transition-colors hover:bg-[#151d5c]"
              >
                Yönetici Girişi
              </Link>
            </div>

            <div className="flex items-center justify-end gap-1 lg:hidden">
              <ThemeToggleButton />
              <button
                type="button"
                className="touch-target flex h-11 w-11 flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-white/80 text-[#0E1548] transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/80 dark:text-white dark:hover:bg-slate-800"
                onClick={() => setIsMenuOpen((open) => !open)}
                aria-label={isMenuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
                aria-expanded={isMenuOpen}
              >
                <span
                  className={`block h-0.5 w-5 rounded-full bg-current transition-all duration-300 ${
                    isMenuOpen ? 'translate-y-[3px] rotate-45' : '-translate-y-[3px]'
                  }`}
                />
                <span
                  className={`my-[3px] block h-0.5 w-5 rounded-full bg-current transition-all duration-300 ${
                    isMenuOpen ? 'scale-x-0 opacity-0' : 'opacity-100'
                  }`}
                />
                <span
                  className={`block h-0.5 w-5 rounded-full bg-current transition-all duration-300 ${
                    isMenuOpen ? '-translate-y-[3px] -rotate-45' : 'translate-y-[3px]'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="fixed inset-0 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-[#0E1548]/40 backdrop-blur-sm"
              aria-label="Menüyü kapat"
              onClick={closeMenu}
            />

            <motion.nav
              className="absolute inset-x-0 bottom-0 top-0 flex flex-col bg-white safe-pt safe-pb dark:bg-slate-950"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 340 }}
              aria-label="Mobil menü"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <BrandMark size="sm" />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{APP_NAME}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{APP_TAGLINE_TR}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeMenu}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400"
                  aria-label="Kapat"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-5">
                <p className="mb-3 px-2 text-xs font-bold uppercase tracking-wider text-slate-400">Gezinti</p>
                <ul className="space-y-1">
                  {navLinks.map((link) => {
                    const isActive = activeSection === link.sectionId;
                    return (
                      <li key={link.href}>
                        <a
                          href={link.href}
                          onClick={closeMenu}
                          aria-current={isActive ? 'true' : undefined}
                          className={`touch-target flex items-center gap-3 rounded-2xl px-4 py-3.5 text-base font-semibold transition-colors ${
                            isActive
                              ? 'bg-[#0E1548] text-white shadow-md shadow-[#0E1548]/20'
                              : 'text-slate-700 hover:bg-slate-50 active:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900 dark:active:bg-slate-800'
                          }`}
                        >
                          <NavIcon>{link.icon}</NavIcon>
                          {link.label}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="space-y-2 border-t border-slate-100 px-4 py-5 dark:border-slate-800">
                <Link
                  href="/admin-panel/register"
                  onClick={closeMenu}
                  className="touch-target flex items-center justify-center rounded-xl bg-[#0E1548] px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#0E1548]/25"
                >
                  Ücretsiz Kayıt Ol
                </Link>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/personnel-panel/login"
                    onClick={closeMenu}
                    className="touch-target flex items-center justify-center rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
                  >
                    Personel
                  </Link>
                  <Link
                    href="/admin-panel/login"
                    onClick={closeMenu}
                    className="touch-target flex items-center justify-center rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
                  >
                    Yönetici
                  </Link>
                </div>
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
