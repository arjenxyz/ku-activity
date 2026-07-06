'use client';

import { usePathname } from 'next/navigation';
import { Suspense } from 'react';
import { PersonnelNotificationsProvider } from '@/contexts/PersonnelNotificationsContext';
import { PersonnelClosureProvider } from '@/contexts/PersonnelClosureContext';
import { PersonnelAppBottomNav } from '@/components/personnel/PersonnelAppBottomNav';
import { PersonnelTopBar } from '@/components/personnel/PersonnelTopBar';
import { PersonnelClosureGate } from '@/components/personnel/PersonnelClosureGate';
import { PersonnelClosureLoading } from '@/components/personnel/PersonnelClosureLoading';
import { usePersonnelClosure } from '@/hooks/usePersonnelClosure';

function ChromeBody({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const isYoklama = pathname.startsWith('/personnel-panel/yoklama');
  const isAvansOnay = pathname.startsWith('/personnel-panel/avans-onay');
  const isImmersive = isYoklama || isAvansOnay;
  const { inClosure, loading: closureLoading } = usePersonnelClosure();
  const closureLocked = closureLoading || inClosure;
  const hideBottomNav = isImmersive || closureLocked;
  const topPad = isImmersive ? 'pt-0' : 'pt-[calc(3rem+env(safe-area-inset-top))]';

  return (
    <>
      {!closureLocked ? <PersonnelTopBar /> : null}
      <div
        className={
          closureLocked
            ? 'pb-0'
            : hideBottomNav
              ? `pb-0 ${topPad}`
              : `pb-[calc(5.25rem+env(safe-area-inset-bottom))] ${topPad}`
        }
      >
        <PersonnelClosureGate>{children}</PersonnelClosureGate>
      </div>
      {!hideBottomNav ? <PersonnelAppBottomNav /> : null}
    </>
  );
}

function showPersonnelChrome(pathname: string) {
  if (pathname.startsWith('/personnel-panel/login')) return false;
  if (pathname.startsWith('/personnel-panel/unlock')) return false;
  if (pathname.startsWith('/personnel-panel/basvuru')) return false;
  if (pathname.startsWith('/personnel-panel/pin-sifirla')) return false;
  if (pathname.startsWith('/personnel-panel/sifremi-unuttum')) return false;
  return pathname.startsWith('/personnel-panel');
}

export function PersonnelPanelChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const withChrome = showPersonnelChrome(pathname);

  if (!withChrome) {
    return <>{children}</>;
  }

  return (
    <PersonnelNotificationsProvider>
      <PersonnelClosureProvider>
        <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 sm:bg-transparent">
          <Suspense fallback={<PersonnelClosureLoading />}>
            <ChromeBody>{children}</ChromeBody>
          </Suspense>
        </div>
      </PersonnelClosureProvider>
    </PersonnelNotificationsProvider>
  );
}
