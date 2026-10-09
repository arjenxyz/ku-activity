'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandMark } from '@/components/brand/BrandMark';
import { LanguageSwitch } from '@/components/i18n/LanguageSwitch';
import { APP_NAME, APP_SHORT_NAME } from '@/lib/brand';

type Props = {
  homeHref: string;
  menuOpen?: boolean;
  onToggleMenu?: () => void;
};

/** Panel top bar — matches public HomeHeader chrome. */
export function AppTopBar({ homeHref, menuOpen, onToggleMenu }: Props) {
  const pathname = usePathname() ?? '';
  const [sessionName, setSessionName] = useState<string | null>(null);

  const isEventsSection =
    pathname === '/admin/events' || pathname.startsWith('/admin/events/');
  const isEventsForm =
    pathname === '/admin/events/new' || /\/admin\/events\/[^/]+\/edit\/?$/.test(pathname);

  const brandHref = isEventsForm ? '/admin/events' : homeHref;
  const brandLabel = isEventsForm
    ? 'Etkinlik listesine dön'
    : isEventsSection
      ? 'Admin paneline dön'
      : APP_NAME;

  useEffect(() => {
    void (async () => {
      const response = await fetch('/api/session');
      const payload = (await response.json().catch(() => null)) as {
        session?: { name: string } | null;
      } | null;
      setSessionName(payload?.session?.name?.trim() || null);
    })();
  }, []);

  const title =
    menuOpen && sessionName
      ? sessionName
      : isEventsSection
        ? 'Admin Panel'
        : APP_SHORT_NAME;

  const subtitle = menuOpen ? null : isEventsSection ? 'geri dönmek için tıklayın' : null;
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-transparent px-3 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-6">
      <div className="mx-auto flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/95 px-3 py-2 shadow-sm backdrop-blur-lg sm:px-4">
        <Link href={brandHref} className="flex min-w-0 items-center gap-2.5" aria-label={brandLabel}>
          <BrandMark size="sm" className="!h-9 !w-9" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-[#0E1548]">{title}</span>
            {subtitle ? (
              <span className="block truncate text-[10px] text-slate-500 hover:text-[#2D6AF6]">
                {subtitle}
              </span>
            ) : null}
          </span>
        </Link>

        {onToggleMenu ? (
          <div className="flex shrink-0 items-center gap-0.5">
            <LanguageSwitch variant="flag" />
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
          </div>
        ) : null}
      </div>
    </header>
  );
}
