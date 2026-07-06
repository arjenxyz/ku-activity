'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandMark } from '@/components/brand/BrandMark';
import { PersonnelNotificationsBell } from '@/components/personnel/PersonnelNotificationsBell';
import { usePersonnelNotificationsContext } from '@/contexts/PersonnelNotificationsContext';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { APP_TAGLINE, APP_TAGLINE_TR } from '@/lib/brand';

type Props = {
  immersive?: boolean;
};

export function PersonnelTopBar({ immersive = false }: Props) {
  const pathname = usePathname() ?? '';
  const { locale } = useLocale();
  const tagline = locale === 'en' ? APP_TAGLINE : APP_TAGLINE_TR;
  const { panelOpen } = usePersonnelNotificationsContext();
  const immersivePath =
    immersive ||
    pathname.startsWith('/personnel-panel/yoklama') ||
    pathname.startsWith('/personnel-panel/avans-onay');

  const shellClass = immersivePath
    ? 'fixed top-0 inset-x-0 z-[250]'
    : 'sticky top-0 z-[250]';

  const cardClass = immersivePath
    ? 'border-white/15 bg-black/60 shadow-lg shadow-black/30'
    : 'border-slate-200/90 bg-white/95 shadow-md shadow-slate-900/[0.06] dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-black/25';

  const wordmarkClass = immersivePath
    ? 'text-white'
    : 'text-[#0E1548] dark:text-white';

  const taglineClass = immersivePath
    ? 'text-white/55'
    : 'text-slate-500 dark:text-slate-400';

  return (
    <header className={shellClass}>
      <div className="safe-pt px-3 pb-2">
        <div className="mx-auto max-w-5xl">
          <div
            className={`flex h-14 items-center justify-between gap-3 rounded-2xl border px-3 backdrop-blur-xl sm:px-4 ${cardClass}`}
          >
            <Link
              href="/personnel-panel"
              className="flex min-w-0 flex-1 items-center gap-2.5 transition-opacity hover:opacity-90 active:opacity-80"
            >
              <BrandMark
                size="sm"
                className={
                  immersivePath
                    ? 'shrink-0 ring-2 ring-white/20 shadow-lg'
                    : 'shrink-0 ring-2 ring-[#0E1548]/10 shadow-md dark:ring-white/15'
                }
              />
              <div className="min-w-0">
                <p
                  className={`truncate text-[13px] font-bold tracking-[0.08em] leading-tight ${wordmarkClass}`}
                >
                  CREWLEDGER
                </p>
                <p className={`truncate text-[10px] font-medium leading-tight ${taglineClass}`}>
                  {tagline}
                </p>
              </div>
            </Link>

            <div
              className={`shrink-0 rounded-xl p-0.5 transition-colors ${
                panelOpen
                  ? immersivePath
                    ? 'bg-white shadow-md'
                    : 'bg-[#0E1548] shadow-md shadow-[#0E1548]/25'
                  : immersivePath
                    ? 'bg-white/10'
                    : 'bg-slate-100/80 dark:bg-slate-800/80'
              }`}
            >
              <PersonnelNotificationsBell
                tone={immersivePath ? 'onDark' : 'light'}
                panelOpen={panelOpen}
                className="!h-10 !w-10 !border-0 !bg-transparent"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
