'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';

const DISMISS_KEY = 'crewledger_home_download_banner_dismissed';

export function HomeDownloadBanner() {
  const strings = useRegistryStrings('components/home/HomeDownloadBanner');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY) === '1') return;
    setVisible(true);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  };

  return (
    <div
      id="nav-2"
      className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+2.75rem)] z-30 sm:top-[calc(env(safe-area-inset-top)+3.25rem)]"
    >
      <div
        id="nav-inner"
        className="nav_inner pointer-events-auto border-b border-[#2D6AF6]/15 bg-[#F3F7FF]/95 shadow-[0_1px_0_rgba(14,21,72,0.04)] backdrop-blur-md"
      >
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2 sm:gap-3 sm:px-6 sm:py-2.5 lg:px-8">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold leading-snug text-[#0E1548] sm:text-sm">
              {strings.title}
            </p>
            <p className="mt-0.5 hidden truncate text-xs leading-snug text-slate-500 sm:block">
              {strings.subtitle}
            </p>
          </div>

          <Link
            href="#play-store"
            onClick={dismiss}
            className="shrink-0 rounded-full bg-[#2D6AF6] px-3.5 py-2 text-[11px] font-semibold leading-none text-white transition hover:bg-[#2459cf] active:bg-[#1f4fb8] sm:px-4 sm:py-2 sm:text-xs"
          >
            {strings.cta}
          </Link>

          <button
            type="button"
            onClick={dismiss}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#0E1548]/65 transition hover:bg-[#0E1548]/8 hover:text-[#0E1548] active:bg-[#0E1548]/12"
            aria-label={strings.closeAriaLabel}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
