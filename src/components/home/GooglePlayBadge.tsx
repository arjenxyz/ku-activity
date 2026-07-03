'use client';

import Image from 'next/image';
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
};

export function GooglePlayBadge({ href, enabled, size = 'md' }: GooglePlayBadgeProps) {
  const badgeHeight = size === 'sm' ? 'h-[44px]' : 'h-[56px]';

  if (!enabled) {
    return (
      <div className="inline-flex items-center gap-3 rounded-2xl border border-dashed border-slate-300/80 dark:border-slate-600 bg-white/60 dark:bg-slate-800/60 px-4 py-3 backdrop-blur-sm">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white shadow-md dark:border-slate-600 dark:bg-slate-800">
          <GooglePlayIcon className="h-6 w-6" />
        </span>
        <div className="text-left">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Google Play
          </p>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Yakında yayında</p>
        </div>
      </div>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block transition-transform hover:scale-[1.03] active:scale-[0.98] drop-shadow-lg"
      aria-label="Google Play'den indir"
    >
      <Image
        src={PLAY_STORE_BADGE_TR}
        alt="Google Play'den edinin"
        width={200}
        height={59}
        className={`${badgeHeight} w-auto`}
        unoptimized
      />
    </a>
  );
}
