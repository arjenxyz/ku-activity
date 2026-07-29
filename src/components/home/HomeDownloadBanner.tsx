'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { APP_NAME, CREWLEDGER_APP_ICON } from '@/lib/brand';

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
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-4 sm:pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      <div
        id="nav-inner"
        className="nav_inner pointer-events-auto relative w-full max-w-2xl rounded-xl border border-sky-100 bg-[#eef6fc] px-2.5 py-1.5 shadow-md shadow-slate-900/8 sm:rounded-2xl sm:px-5 sm:py-3.5 sm:shadow-lg sm:shadow-slate-900/10"
      >
        <button
          type="button"
          onClick={dismiss}
          className="absolute -left-0.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-sky-200 bg-white text-sky-600 shadow-sm transition hover:bg-sky-50 sm:-left-1 sm:-top-2 sm:h-7 sm:w-7"
          aria-label={strings.closeAriaLabel}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" aria-hidden>
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-sky-200/80 sm:h-14 sm:w-14 sm:rounded-xl">
            <Image
              src={CREWLEDGER_APP_ICON}
              alt={APP_NAME}
              width={56}
              height={56}
              className="h-full w-full object-contain p-0.5 sm:p-1.5"
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold leading-tight text-[#0b2f5b] sm:text-[0.95rem] sm:font-bold sm:leading-snug">
              {strings.title}
            </p>
            <p className="mt-0 truncate text-[10px] leading-tight text-slate-500 sm:mt-0.5 sm:text-sm sm:leading-snug">
              {strings.subtitle}
            </p>
          </div>

          <Link
            href="#play-store"
            onClick={dismiss}
            className="shrink-0 rounded-lg bg-[#2D6AF6] px-2.5 py-1.5 text-[10px] font-semibold leading-none text-white transition hover:bg-[#2459cf] sm:rounded-xl sm:px-5 sm:py-2.5 sm:text-sm"
          >
            {strings.cta}
          </Link>
        </div>
      </div>
    </div>
  );
}
