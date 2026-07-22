'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FiHash, FiLogOut } from 'react-icons/fi';
import { BrandMark } from '@/components/brand/BrandMark';
import { usePersonnelTopBarEnterCodeAction } from '@/contexts/PersonnelTopBarActionsContext';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { APP_TAGLINE, APP_TAGLINE_TR } from '@/lib/brand';
import { personnelChromeSurfaceClass } from '@/lib/personnel-chrome-surface';

type Props = {
  immersive?: boolean;
};

export function PersonnelTopBar({ immersive = false }: Props) {
  const pathname = usePathname() ?? '';
  const searchParams = useSearchParams();
  const router = useRouter();
  const { locale } = useLocale();
  const defaultTagline = locale === 'tr' ? APP_TAGLINE_TR : APP_TAGLINE;
  const yoklamaStrings = useRegistryStrings('app/personnel-panel/yoklama/page');
  const advanceStrings = useRegistryStrings('app/personnel-panel/avans/page');
  const settingsStrings = useRegistryStrings('components/personnel/PersonnelSettingsPage');
  const topBarActions = usePersonnelTopBarEnterCodeAction();
  const isYoklama = pathname.startsWith('/personnel-panel/yoklama');
  const isAdvancePage = pathname.startsWith('/personnel-panel/avans');
  const isSettings = pathname === '/personnel-panel' && searchParams.get('tab') === 'settings';
  const immersivePath =
    immersive ||
    isYoklama ||
    pathname.startsWith('/personnel-panel/avans-onay');

  const tagline = isYoklama
    ? yoklamaStrings.exitHint
    : isAdvancePage
      ? advanceStrings.panelReturnHint
    : isSettings
      ? settingsStrings.exitHint
      : defaultTagline;
  const enterCode = isYoklama ? topBarActions?.enterCode : null;
  const surfaceClass = personnelChromeSurfaceClass(pathname, searchParams.get('tab'));

  const shellClass = immersivePath
    ? `fixed top-0 inset-x-0 z-[var(--personnel-topbar-z)] ${surfaceClass}`
    : 'sticky top-0 z-[var(--personnel-topbar-z)] bg-transparent';

  const cardClass = immersivePath
    ? 'border-white/15 bg-black/60 shadow-lg shadow-black/30'
    : 'border-slate-200/90 bg-white/95 shadow-md shadow-slate-900/[0.06] dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-black/25';

  const wordmarkClass = immersivePath
    ? 'text-white'
    : 'text-[#0E1548] dark:text-white';

  const taglineClass = immersivePath
    ? 'text-white/55'
    : 'text-slate-500 dark:text-slate-400';

  const handleLogout = async () => {
    await fetch('/api/auth/personnel/logout', { method: 'POST' });
    router.replace('/personnel-panel/login');
    router.refresh();
  };

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
              aria-label={
                isYoklama
                  ? yoklamaStrings.exitAriaLabel
                  : isSettings
                    ? settingsStrings.exitAriaLabel
                    : undefined
              }
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

            {enterCode ? (
              <button
                type="button"
                disabled={enterCode.disabled}
                onClick={enterCode.onClick}
                aria-label={
                  enterCode.variant === 'cancel' ? yoklamaStrings.cancelCodeAriaLabel : undefined
                }
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-white/10 px-3 text-sm font-semibold text-white transition active:bg-white/20 disabled:opacity-40"
              >
                {enterCode.variant !== 'cancel' ? <FiHash className="h-4 w-4" /> : null}
                {enterCode.label}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleLogout()}
                aria-label={settingsStrings.logout}
                title={settingsStrings.logout}
                className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                  immersivePath
                    ? 'bg-white/10 text-white hover:bg-white/20'
                    : 'bg-slate-100/80 text-[#0E1548] hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800/80 dark:text-white dark:hover:bg-rose-950/40 dark:hover:text-rose-300'
                }`}
              >
                <FiLogOut className="h-[1.05rem] w-[1.05rem]" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
