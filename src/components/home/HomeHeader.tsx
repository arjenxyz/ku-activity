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

function LoginCluster({ className = '', onNavigate }: { className?: string; onNavigate?: () => void }) {
  return (
    <div
      className={`inline-flex items-center rounded-xl border border-slate-200/90 bg-slate-100/70 p-1 dark:border-slate-700/80 dark:bg-slate-800/60 ${className}`}
    >
      <Link
        href="/personnel-panel/login"
        onClick={onNavigate}
        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-white hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-900 dark:hover:text-white"
      >
        <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-md shadow-sm ring-1 ring-black/5">
          <Image src={PLAY_STORE_PERSONNEL_ICON} alt="" width={24} height={24} className="h-full w-full object-cover" />
        </span>
        <span className="hidden xl:inline">Personel Girişi</span>
        <span className="xl:hidden">Personel</span>
      </Link>

      <span className="mx-0.5 h-5 w-px shrink-0 bg-slate-300/80 dark:bg-slate-600" aria-hidden />

      <Link
        href="/admin-panel/login"
        onClick={onNavigate}
        className="inline-flex items-center gap-2 rounded-lg bg-[#0E1548] px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#151d5c] dark:shadow-black/20"
      >
        <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-md shadow-sm ring-1 ring-white/20">
          <Image src={PLAY_STORE_ADMIN_ICON} alt="" width={24} height={24} className="h-full w-full object-cover" />
        </span>
        <span className="hidden xl:inline">Yönetici Girişi</span>
        <span className="xl:hidden">Yönetici</span>
      </Link>
    </div>
  );
}

function MobileLoginLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="space-y-2">
      <Link
        href="/personnel-panel/login"
        onClick={onNavigate}
        className="touch-target flex items-center gap-3 rounded-xl border border-slate-200/90 bg-slate-50 px-4 py-3.5 font-semibold text-slate-800 transition-colors active:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-100 dark:active:bg-slate-800"
      >
        <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl ring-1 ring-black/5">
          <Image src={PLAY_STORE_PERSONNEL_ICON} alt="" width={36} height={36} className="h-full w-full object-cover" />
        </span>
        <span className="flex-1">Personel Girişi</span>
        <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
      <Link
        href="/admin-panel/login"
        onClick={onNavigate}
        className="touch-target flex items-center gap-3 rounded-xl bg-[#0E1548] px-4 py-3.5 font-semibold text-white shadow-md shadow-[#0E1548]/20 transition-colors active:bg-[#151d5c]"
      >
        <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/20">
          <Image src={PLAY_STORE_ADMIN_ICON} alt="" width={36} height={36} className="h-full w-full object-cover" />
        </span>
        <span className="flex-1">Yönetici Girişi</span>
        <svg className="h-4 w-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
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

            <div className="hidden md:flex items-center gap-2.5">
              <ThemeToggleButton />
              <LoginCluster />
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
