'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ThemeToggleButton } from '@/components/auth/ThemeToggleButton';
import { BrandMark } from '@/components/brand/BrandMark';
import { APP_NAME, APP_TAGLINE_TR } from '@/lib/brand';

const navLinks = [
  { href: '#hero', label: 'Anasayfa' },
  { href: '#features', label: 'Özellikler' },
  { href: '#how-it-works', label: 'Nasıl Çalışır' },
  { href: '#contact', label: 'İletişim' },
];

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
              <Link
                href="/personnel-panel/login"
                className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 px-3 py-2 transition-colors"
              >
                Personel
              </Link>
              <Link
                href="/admin-panel/login"
                className="text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl shadow-lg shadow-blue-500/25 transition-all"
              >
                Yönetici Girişi
              </Link>
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

      {/* Mobil tam ekran menü */}
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
              <Link
                href="/personnel-panel/login"
                onClick={() => setIsMenuOpen(false)}
                className="touch-target flex items-center justify-center border-2 border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-200 px-4 py-3.5 rounded-xl font-semibold"
              >
                Personel Girişi
              </Link>
              <Link
                href="/admin-panel/login"
                onClick={() => setIsMenuOpen(false)}
                className="touch-target flex items-center justify-center bg-blue-600 text-white px-4 py-3.5 rounded-xl font-semibold shadow-lg shadow-blue-500/25"
              >
                Yönetici Girişi
              </Link>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}
