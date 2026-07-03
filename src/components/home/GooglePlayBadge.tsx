'use client';

import Image from 'next/image';
import { PLAY_STORE_BADGE_TR } from '@/lib/play-store';

function GooglePlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3.609 1.814L13.792 12 3.61 22.186a1.003 1.003 0 01-.52-.191 1 1 0 01-.378-.778V2.773a1 1 0 01.378-.778 1.003 1.003 0 01.52-.181zm1.16 20.095l8.315-8.315-2.4-2.4-5.915 10.715zm2.4-12.49l2.4-2.4 8.315 8.315L7.169 9.419zM20.52 10.838l-2.152-1.244-2.4 2.4 2.152 1.244a1 1 0 001.732 0l.67-1.156a1 1 0 000-1.244z" />
    </svg>
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
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-md shadow-green-500/25">
          <GooglePlayIcon className="h-5 w-5" />
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

export { GooglePlayIcon };
