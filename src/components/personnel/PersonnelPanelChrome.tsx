'use client';

import { usePathname } from 'next/navigation';
import { Suspense } from 'react';
import { PersonnelNotificationsProvider } from '@/contexts/PersonnelNotificationsContext';
import { PersonnelTopBarActionsProvider } from '@/contexts/PersonnelTopBarActionsContext';
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

  return (
    <>
      {!closureLocked ? <PersonnelTopBar immersive={isImmersive} /> : null}
      <div
        className={
          closureLocked
            ? 'pb-0'
            : hideBottomNav
              ? isYoklama
                ? 'pb-0'
                : 'pb-0 personnel-topbar-offset'
              : 'pb-[calc(5.25rem+env(safe-area-inset-bottom))]'
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
  const isYoklama = pathname.startsWith('/personnel-panel/yoklama');

  if (!withChrome) {
    return <>{children}</>;
  }

  return (
    <PersonnelNotificationsProvider>
      <PersonnelTopBarActionsProvider>
        <PersonnelClosureProvider>
          <div
            className={
              isYoklama
                ? 'min-h-[100dvh] bg-black sm:bg-transparent'
                : 'min-h-[100dvh] bg-slate-50 dark:bg-slate-950 sm:bg-transparent'
            }
          >
            <Suspense fallback={<PersonnelClosureLoading />}>
              <ChromeBody>{children}</ChromeBody>
            </Suspense>
          </div>
        </PersonnelClosureProvider>
      </PersonnelTopBarActionsProvider>
    </PersonnelNotificationsProvider>
  );
}
