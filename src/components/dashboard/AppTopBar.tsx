'use client';

import Link from 'next/link';
import { BrandMark } from '@/components/brand/BrandMark';

type Props = {
  /** Panel home (e.g. /admin) — kept for callers; brand link goes to site home. */
  homeHref: string;
  title?: string;
  menuOpen?: boolean;
  onToggleMenu?: () => void;
};

/** Panel top bar — matches public HomeHeader chrome. */
export function AppTopBar({
  title = 'Admin Panel',
  menuOpen,
  onToggleMenu,
}: Props) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-transparent px-3 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/95 px-3 py-2 shadow-sm backdrop-blur-lg sm:px-4 lg:max-w-7xl">
        <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label="Ana sayfaya dön">
          <BrandMark size="sm" className="!h-9 !w-9" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-[#0E1548]">{title}</span>
            <span className="block truncate text-[10px] text-slate-500 hover:text-[#2D6AF6]">
              geri dönmek için tıklayın
            </span>
          </span>
        </Link>

        {onToggleMenu ? (
          <button
            type="button"
            className="flex h-10 w-10 flex-col items-center justify-center rounded-xl hover:bg-slate-100"
            aria-label={menuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
            aria-expanded={menuOpen}
            onClick={onToggleMenu}
          >
            <span
              className={`block h-0.5 w-5 rounded-sm bg-[#0E1548] transition ${
                menuOpen ? 'translate-y-1 rotate-45' : ''
              }`}
            />
            <span
              className={`my-1 block h-0.5 w-5 rounded-sm bg-[#0E1548] transition ${
                menuOpen ? 'opacity-0' : ''
              }`}
            />
            <span
              className={`block h-0.5 w-5 rounded-sm bg-[#0E1548] transition ${
                menuOpen ? '-translate-y-1 -rotate-45' : ''
              }`}
            />
          </button>
        ) : null}
      </div>
    </header>
  );
}
