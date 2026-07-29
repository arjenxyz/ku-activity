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
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      <div
        id="nav-inner"
        className="nav_inner pointer-events-auto relative w-full max-w-2xl rounded-2xl border border-sky-100 bg-[#eef6fc] px-3 py-3 shadow-lg shadow-slate-900/10 sm:px-5 sm:py-3.5"
      >
        <button
          type="button"
          onClick={dismiss}
          className="absolute -left-1 -top-2 flex h-7 w-7 items-center justify-center rounded-full border border-sky-200 bg-white text-sky-600 shadow-sm transition hover:bg-sky-50"
          aria-label={strings.closeAriaLabel}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-sky-200/80 sm:h-14 sm:w-14">
            <Image
              src={CREWLEDGER_APP_ICON}
              alt={APP_NAME}
              width={56}
              height={56}
              className="h-full w-full object-contain p-1.5"
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold leading-snug text-[#0b2f5b] sm:text-[0.95rem]">{strings.title}</p>
            <p className="mt-0.5 text-xs leading-snug text-slate-500 sm:text-sm">{strings.subtitle}</p>
          </div>

          <Link
            href="#play-store"
            onClick={dismiss}
            className="shrink-0 rounded-xl bg-[#2D6AF6] px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#2459cf] sm:px-5 sm:text-sm"
          >
            {strings.cta}
          </Link>
        </div>
      </div>
    </div>
  );
}
