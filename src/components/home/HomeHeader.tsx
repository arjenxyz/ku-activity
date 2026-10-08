'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BrandMark } from '@/components/brand/BrandMark';
import { LanguageSwitch } from '@/components/i18n/LanguageSwitch';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { APP_NAME, APP_TAGLINE } from '@/lib/brand';

const NAV = [
  { href: '#nasil', label: 'Nasıl çalışır' },
  { href: '#etkinlik', label: 'Etkinlik' },
  { href: '#iletisim', label: 'İletişim' },
];

export function HomeHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useBodyScrollLock(open);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
    <header
      className={`fixed inset-x-0 top-0 z-50 safe-pt transition-all duration-300 ${
        scrolled || open
          ? 'border-b border-slate-200/70 bg-white/95 shadow-sm backdrop-blur-lg'
          : 'bg-white/80 backdrop-blur-sm'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <BrandMark size="sm" className="!h-9 !w-9" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-[#0E1548]">{APP_NAME}</span>
            <span className="hidden truncate text-[10px] text-slate-500 sm:block">{APP_TAGLINE}</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Sayfa">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-[#0E1548]"
            >
              {item.label}
            </a>
          ))}
          <LanguageSwitch variant="compact" />
          <Link
            href="/login"
            className="ml-2 rounded-2xl bg-[#0E1548] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#152060]"
          >
            Giriş yap
          </Link>
        </nav>

        <button
          type="button"
          className="flex h-10 w-10 flex-col items-center justify-center rounded-xl hover:bg-slate-100 md:hidden"
          aria-label={open ? 'Menüyü kapat' : 'Menüyü aç'}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span className={`block h-0.5 w-5 rounded-sm bg-[#0E1548] transition ${open ? 'translate-y-1 rotate-45' : ''}`} />
          <span className={`my-1 block h-0.5 w-5 rounded-sm bg-[#0E1548] transition ${open ? 'opacity-0' : ''}`} />
          <span className={`block h-0.5 w-5 rounded-sm bg-[#0E1548] transition ${open ? '-translate-y-1 -rotate-45' : ''}`} />
        </button>
      </div>
    </header>

      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 md:hidden ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden={!open}
      >
        <button
          type="button"
          className="absolute inset-0 bg-[#0E1548]/55"
          aria-label="Menüyü kapat"
          onClick={() => setOpen(false)}
        />
        <nav
          className={`absolute bottom-0 right-0 top-0 flex w-[min(86vw,320px)] flex-col border-l border-slate-200 bg-white shadow-2xl shadow-slate-900/20 transition-transform duration-300 safe-pb ${
            open ? 'translate-x-0' : 'translate-x-full'
          }`}
          aria-label="Mobil menü"
        >
          <div className="flex h-full flex-col p-5 pt-16">
            <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Menü</p>
            <LanguageSwitch variant="nav" />
            <div className="min-h-0 flex-1 overflow-y-auto">
              {NAV.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center rounded-xl px-3 py-3.5 font-medium text-slate-700 hover:bg-slate-50"
                >
                  {item.label}
                </a>
              ))}
            </div>
            <div className="mt-3 shrink-0 border-t border-slate-200 pt-3">
              <Link
                href="/login"
                className="flex items-center justify-center rounded-2xl bg-[#0E1548] px-4 py-3 text-sm font-medium text-white"
                onClick={() => setOpen(false)}
              >
                Giriş yap
              </Link>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}
