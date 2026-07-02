'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { PersonnelAppBottomNav } from '@/components/personnel/PersonnelAppBottomNav';
import { PersonnelMobileHeader } from '@/components/personnel/PersonnelMobileHeader';
import type { PersonnelTabId } from '@/hooks/usePersonnelTab';
import { PERSONNEL_TABS } from '@/hooks/usePersonnelTab';

function isValidTab(value: string | null): value is PersonnelTabId {
  return PERSONNEL_TABS.includes(value as PersonnelTabId);
}

function ChromeBody({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab = isValidTab(tabParam) ? tabParam : 'overview';
  const isOverview = pathname === '/personnel-panel' && tab === 'overview';

  return (
    <>
      <PersonnelMobileHeader />
      <div
        className={`pb-[calc(4.75rem+env(safe-area-inset-bottom))] sm:pt-0 sm:pb-0 ${
          isOverview
            ? 'pt-[max(0.5rem,env(safe-area-inset-top))]'
            : 'pt-[calc(3rem+env(safe-area-inset-top))]'
        }`}
      >
        {children}
      </div>
      <PersonnelAppBottomNav />
    </>
  );
}

function showPersonnelChrome(pathname: string) {
  if (pathname.startsWith('/personnel-panel/login')) return false;
  if (pathname.startsWith('/personnel-panel/basvuru')) return false;
  return pathname.startsWith('/personnel-panel');
}

export function PersonnelPanelChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const withChrome = showPersonnelChrome(pathname);

  if (!withChrome) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 sm:bg-transparent">
      <Suspense fallback={<div className="min-h-[100dvh]">{children}</div>}>
        <ChromeBody>{children}</ChromeBody>
      </Suspense>
    </div>
  );
}
