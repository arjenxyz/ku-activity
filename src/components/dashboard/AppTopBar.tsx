'use client';

import Link from 'next/link';
import { FiLogOut, FiMenu } from 'react-icons/fi';
import { BrandMark } from '@/components/brand/BrandMark';
import { APP_NAME, APP_SHORT_NAME } from '@/lib/brand';

type Props = {
  homeHref: string;
  subtitle?: string;
  onLogout?: () => void;
  onOpenMenu?: () => void;
};

/** Preserves CrewLedger AdminTopBar visual language without domain logic. */
export function AppTopBar({ homeHref, subtitle, onLogout, onOpenMenu }: Props) {
  return (
    <header className="sticky top-0 z-[var(--personnel-topbar-z,40)] bg-transparent">
      <div className="safe-pt px-3 pb-2">
        <div className="mx-auto max-w-5xl">
          <div className="flex h-14 items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white/95 px-3 shadow-md shadow-slate-900/[0.06] backdrop-blur-xl sm:px-4">
            <Link
              href={homeHref}
              className="flex min-w-0 flex-1 items-center gap-2.5 transition-opacity hover:opacity-90 active:opacity-80"
              aria-label={APP_NAME}
            >
              <BrandMark size="sm" className="shrink-0 ring-2 ring-[#0E1548]/10 shadow-md" />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-bold tracking-[0.08em] leading-tight text-[#0E1548]">
                  {APP_SHORT_NAME}
                </p>
                <p className="truncate text-[10px] font-medium leading-tight text-slate-500">
                  {subtitle ?? APP_NAME}
                </p>
              </div>
            </Link>

            <div className="flex shrink-0 items-center gap-1.5">
              {onOpenMenu ? (
                <button
                  type="button"
                  onClick={onOpenMenu}
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-[#0E1548]"
                  aria-label="Menü"
                >
                  <FiMenu className="h-5 w-5" />
                </button>
              ) : null}
              {onLogout ? (
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-[#0E1548]"
                  aria-label="Çıkış"
                >
                  <FiLogOut className="h-5 w-5" />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
