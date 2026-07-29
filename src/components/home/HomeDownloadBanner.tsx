'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';

const DISMISS_KEY = 'crewledger_home_download_banner_dismissed';

type HomeDownloadBannerProps = {
  /** Called when visibility changes so the parent chrome can remeasure height. */
  onVisibilityChange?: (visible: boolean) => void;
};

/** Slim download prompt row — meant to sit inside HomeHeader, not as a second fixed bar. */
export function HomeDownloadBanner({ onVisibilityChange }: HomeDownloadBannerProps) {
  const strings = useRegistryStrings('components/home/HomeDownloadBanner');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY) === '1') {
      onVisibilityChange?.(false);
      return;
    }
    setVisible(true);
    onVisibilityChange?.(true);
  }, [onVisibilityChange]);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
    onVisibilityChange?.(false);
  };

  return (
    <div
      id="nav-2"
      className="border-t border-[#2D6AF6]/12 bg-[#EEF3FF]/90"
      role="region"
      aria-label={strings.title}
    >
      <div
        id="nav-inner"
        className="nav_inner mx-auto flex max-w-7xl items-center gap-2.5 px-3 py-1.5 sm:gap-3 sm:px-6 lg:px-8"
      >
        <p className="min-w-0 flex-1 truncate text-[11px] font-medium leading-none text-[#0E1548]/90 sm:text-xs">
          {strings.title}
        </p>

        <Link
          href="#play-store"
          onClick={dismiss}
          className="shrink-0 rounded-full bg-[#2D6AF6] px-3 py-1.5 text-[11px] font-semibold leading-none text-white transition hover:bg-[#2459cf] active:bg-[#1f4fb8] sm:px-3.5 sm:text-xs"
        >
          {strings.cta}
        </Link>

        <button
          type="button"
          onClick={dismiss}
          className="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#0E1548]/55 transition hover:bg-[#0E1548]/8 hover:text-[#0E1548] active:bg-[#0E1548]/12"
          aria-label={strings.closeAriaLabel}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
