'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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

function AppIconBadge({
  src,
  variant,
}: {
  src: string;
  variant: 'personel' | 'admin';
}) {
  const shell =
    variant === 'personel'
      ? 'bg-gradient-to-br from-violet-100 to-indigo-100 ring-violet-200/60 dark:from-violet-950/50 dark:to-indigo-950/40 dark:ring-violet-800/40'
      : 'bg-white/20 ring-white/25';

  return (
    <span
      className={`relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg p-0.5 ring-1 ${shell}`}
    >
      <Image src={src} alt="" width={28} height={28} className="h-full w-full rounded-[6px] object-cover" />
    </span>
  );
}

function DesktopLoginActions({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <Link
        href="/personnel-panel/login"
        onClick={onNavigate}
        aria-label="Personel girişi"
        className="group inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-violet-200 hover:bg-violet-50/40 hover:text-violet-950 hover:shadow-md dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-violet-800 dark:hover:bg-violet-950/30 dark:hover:text-violet-100"
      >
        <AppIconBadge src={PLAY_STORE_PERSONNEL_ICON} variant="personel" />
        <span className="hidden lg:inline">Personel</span>
      </Link>

      <Link
        href="/admin-panel/login"
        onClick={onNavigate}
        aria-label="Yönetici girişi"
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-blue-500/30 active:from-blue-800 active:to-indigo-800"
      >
        <AppIconBadge src={PLAY_STORE_ADMIN_ICON} variant="admin" />
        <span className="hidden lg:inline">Yönetici</span>
      </Link>
    </div>
  );
}

function MobileLoginLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="space-y-3">
      <p className="px-1 text-xs font-bold uppercase tracking-wider text-slate-400">Giriş</p>

      <Link
        href="/personnel-panel/login"
        onClick={onNavigate}
        className="touch-target group flex items-center gap-3 overflow-hidden rounded-2xl border border-violet-200/70 bg-gradient-to-br from-violet-50/90 via-white to-indigo-50/50 p-4 shadow-sm transition-all active:scale-[0.99] dark:border-violet-900/50 dark:from-violet-950/30 dark:via-slate-900 dark:to-indigo-950/20"
      >
        <AppIconBadge src={PLAY_STORE_PERSONNEL_ICON} variant="personel" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-slate-900 dark:text-white">Personel Girişi</span>
          <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">Yoklama, yevmiye, bordro</span>
        </span>
        <svg
          className="h-4 w-4 shrink-0 text-violet-400 transition-transform group-hover:translate-x-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>

      <Link
        href="/admin-panel/login"
        onClick={onNavigate}
        className="touch-target group flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-4 shadow-lg shadow-blue-500/25 transition-all active:scale-[0.99] active:from-blue-700 active:to-indigo-700"
      >
        <AppIconBadge src={PLAY_STORE_ADMIN_ICON} variant="admin" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-white">Yönetici Girişi</span>
          <span className="mt-0.5 block text-xs text-blue-100">Proje, onay, raporlar</span>
        </span>
        <svg
          className="h-4 w-4 shrink-0 text-white/70 transition-transform group-hover:translate-x-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
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
              <DesktopLoginActions />
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
            <div className="mt-auto space-y-2 pt-4 border-t border-gray-200 dark:border-slate-700">
              <MobileLoginLinks onNavigate={() => setIsMenuOpen(false)} />
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}
