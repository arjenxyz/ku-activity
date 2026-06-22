'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { FiArrowLeft, FiSettings } from 'react-icons/fi';
import {
  PERSONNEL_MOBILE_TAB_TITLES,
} from '@/config/personnel-mobile-nav';
import type { PersonnelTabId } from '@/hooks/usePersonnelTab';
import { PERSONNEL_TABS } from '@/hooks/usePersonnelTab';

function isValidTab(value: string | null): value is PersonnelTabId {
  return PERSONNEL_TABS.includes(value as PersonnelTabId);
}

function HeaderInner() {
  const pathname = usePathname() ?? '';
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab = isValidTab(tabParam) ? tabParam : 'overview';

  const isYoklama = pathname.startsWith('/personnel-panel/yoklama');
  const title = isYoklama
    ? 'Yoklama'
    : pathname === '/personnel-panel'
      ? PERSONNEL_MOBILE_TAB_TITLES[tab]
      : 'CrewLedger';

  return (
    <header className="fixed top-0 inset-x-0 z-50 sm:hidden border-b border-slate-200/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl safe-pt">
      <div className="flex h-14 items-center gap-3 px-4 max-w-lg mx-auto">
        {isYoklama ? (
          <Link
            href="/personnel-panel"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Panele dön"
          >
            <FiArrowLeft className="h-5 w-5" />
          </Link>
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-sm">
            <Image
              src="/api/pwa-icon/192"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9"
              unoptimized
            />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 leading-none">
            CrewLedger
          </p>
          <h1 className="truncate text-base font-bold text-slate-900 dark:text-white">{title}</h1>
        </div>

        {!isYoklama && (
          <Link
            href="/personnel-panel?tab=settings"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Ayarlar"
          >
            <FiSettings className="h-5 w-5" />
          </Link>
        )}
      </div>
    </header>
  );
}

export function PersonnelMobileHeader() {
  return (
    <Suspense fallback={<div className="fixed top-0 inset-x-0 z-50 h-14 sm:hidden safe-pt bg-white/90" />}>
      <HeaderInner />
    </Suspense>
  );
}
