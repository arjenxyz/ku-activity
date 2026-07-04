'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { FiArrowLeft } from 'react-icons/fi';
import { PERSONNEL_MOBILE_TAB_TITLES } from '@/config/personnel-mobile-nav';
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
  const isOverview = pathname === '/personnel-panel' && tab === 'overview';

  if (isOverview) {
    return <div className="fixed top-0 inset-x-0 z-50 h-0 sm:hidden safe-pt pointer-events-none" aria-hidden />;
  }

  const title = isYoklama
    ? 'Yoklama'
    : pathname === '/personnel-panel'
      ? PERSONNEL_MOBILE_TAB_TITLES[tab]
      : 'Personel';

  return (
    <header
      className={
        isYoklama
          ? 'fixed top-0 inset-x-0 z-50 sm:hidden border-b border-white/10 bg-slate-950/85 backdrop-blur-md safe-pt'
          : 'fixed top-0 inset-x-0 z-50 sm:hidden border-b border-slate-200/70 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md safe-pt'
      }
    >
      <div className="flex h-12 items-center gap-2 px-4 max-w-lg mx-auto">
        {isYoklama && (
          <Link
            href="/personnel-panel"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/90 hover:bg-white/10"
            aria-label="Panele dön"
          >
            <FiArrowLeft className="h-5 w-5" />
          </Link>
        )}
        <h1
          className={
            isYoklama
              ? 'min-w-0 flex-1 truncate text-base font-semibold text-white'
              : 'min-w-0 flex-1 truncate text-base font-semibold text-slate-900 dark:text-white'
          }
        >
          {title}
        </h1>
      </div>
    </header>
  );
}

export function PersonnelMobileHeader() {
  return (
    <Suspense fallback={<div className="fixed top-0 inset-x-0 z-50 h-12 sm:hidden safe-pt bg-white/95" />}>
      <HeaderInner />
    </Suspense>
  );
}
