'use client';

import Image from 'next/image';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { PLAY_STORE_BADGE_TR } from '@/lib/play-store';

export const GOOGLE_PLAY_ICON_SRC = '/Google_Play_icon.svg';

export function GooglePlayIcon({ className }: { className?: string }) {
  return (
    <Image
      src={GOOGLE_PLAY_ICON_SRC}
      alt=""
      width={32}
      height={32}
      className={`shrink-0 ${className ?? ''}`}
      aria-hidden
      unoptimized
    />
  );
}

type GooglePlayBadgeProps = {
  href: string;
  enabled: boolean;
  size?: 'sm' | 'md';
  fullWidth?: boolean;
};

export function GooglePlayBadge({ href, enabled, size = 'md', fullWidth = false }: GooglePlayBadgeProps) {
  const strings = useRegistryStrings('components/home/GooglePlayBadge');
  const badgeHeight = size === 'sm' ? 'h-[44px]' : 'h-[56px]';
  const widthClass = fullWidth ? 'flex w-full' : 'inline-flex';

  if (!enabled) {
    return (
      <div
        className={`${widthClass} items-center gap-3 rounded-2xl border border-dashed border-slate-300/80 bg-white/60 px-4 py-3 backdrop-blur-sm dark:border-slate-600 dark:bg-slate-800/60`}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white shadow-md dark:border-slate-600 dark:bg-slate-800">
          <GooglePlayIcon className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1 text-left">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {strings.googlePlayLabel}
          </p>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{strings.comingSoon}</p>
        </div>
      </div>
    );
  }

  if (fullWidth) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${widthClass} items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-white shadow-md transition-colors hover:bg-slate-800 active:bg-slate-950 dark:bg-slate-950 dark:hover:bg-slate-900`}
        aria-label={strings.downloadAriaLabel}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
          <GooglePlayIcon className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1 text-left">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{strings.googlePlayLabel}</p>
          <p className="text-sm font-semibold">{strings.download}</p>
        </div>
        <svg className="h-5 w-5 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block transition-transform hover:scale-[1.03] active:scale-[0.98] drop-shadow-lg"
      aria-label={strings.downloadAriaLabel}
    >
      <Image
        src={PLAY_STORE_BADGE_TR}
        alt={strings.badgeAlt}
        width={200}
        height={59}
        className={`${badgeHeight} w-auto`}
        unoptimized
      />
    </a>
  );
}
