'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { PersonnelNotificationsProvider } from '@/contexts/PersonnelNotificationsContext';
import { PersonnelTopBarActionsProvider } from '@/contexts/PersonnelTopBarActionsContext';
import { PersonnelClosureProvider } from '@/contexts/PersonnelClosureContext';
import { PersonnelAppBottomNav } from '@/components/personnel/PersonnelAppBottomNav';
import { PersonnelTopBar } from '@/components/personnel/PersonnelTopBar';
import { PersonnelClosureGate } from '@/components/personnel/PersonnelClosureGate';
import { PersonnelClosureLoading } from '@/components/personnel/PersonnelClosureLoading';
import { usePersonnelClosure } from '@/hooks/usePersonnelClosure';
import { personnelChromeSurfaceClass } from '@/lib/personnel-chrome-surface';

function ChromeBody({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  const surfaceClass = personnelChromeSurfaceClass(pathname, tab);
  const isYoklama = pathname.startsWith('/personnel-panel/yoklama');
  const isAvansOnay = pathname.startsWith('/personnel-panel/avans-onay');
  const isSettingsTab = pathname === '/personnel-panel' && tab === 'settings';
  const isImmersive = isYoklama || isAvansOnay;
  const { inClosure, loading: closureLoading } = usePersonnelClosure();
  const closureLocked = closureLoading || inClosure;
  const hideBottomNav = isImmersive || closureLocked || isSettingsTab;

  return (
    <div className={`min-h-[100dvh] ${surfaceClass} sm:bg-transparent`}>
      {!closureLocked ? <PersonnelTopBar immersive={isImmersive} /> : null}
      <div
        className={
          closureLocked
            ? 'pb-0'
            : hideBottomNav
              ? isYoklama
                ? 'pb-0'
                : isSettingsTab
                  ? 'pb-[max(1rem,env(safe-area-inset-bottom))]'
                  : 'pb-0 personnel-topbar-offset'
              : 'pb-[calc(5.25rem+env(safe-area-inset-bottom))]'
        }
      >
        <PersonnelClosureGate>{children}</PersonnelClosureGate>
      </div>
      {!hideBottomNav ? <PersonnelAppBottomNav /> : null}
    </div>
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
      <PersonnelTopBarActionsProvider>
        <PersonnelClosureProvider>
          <Suspense fallback={<PersonnelClosureLoading />}>
            <ChromeBody>{children}</ChromeBody>
          </Suspense>
        </PersonnelClosureProvider>
      </PersonnelTopBarActionsProvider>
    </PersonnelNotificationsProvider>
  );
}
