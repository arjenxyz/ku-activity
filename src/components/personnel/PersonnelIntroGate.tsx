'use client';

import { usePathname } from 'next/navigation';
import { useLayoutEffect, useState } from 'react';
import { usePersonnelSessionGate } from '@/components/personnel/PersonnelSessionGate';
import { PersonnelPushBootstrap } from '@/components/personnel/PersonnelPushBootstrap';
import { PersonnelNotificationPermissionPrompt } from '@/components/personnel/PersonnelNotificationPermissionPrompt';
import { markPersonnelUiReady } from '@/lib/personnel-app-ready';

/** Intro / boot overlay kapandıktan sonra bildirim izni için sinyal */
function scheduleUiReady() {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      window.setTimeout(() => markPersonnelUiReady(), 400);
    });
  });
}

/**
 * Açılış introsu artık tek merkezde (/personnel-panel/basla) gösteriliyor.
 * Bu bileşen yalnızca boot overlay'i kapatır ve yönlendirme beklenmiyorsa
 * push + bildirim izni akışını başlatır.
 */
export function PersonnelIntroGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const sessionGate = usePersonnelSessionGate();
  const [holdForRedirect, setHoldForRedirect] = useState(false);

  useLayoutEffect(() => {
    document.getElementById('cl-intro-boot')?.remove();
    const hold = sessionGate?.onIntroComplete() ?? false;
    setHoldForRedirect(hold);
    if (!hold) scheduleUiReady();
  }, [pathname, sessionGate]);

  if (holdForRedirect) return null;

  return (
    <>
      <PersonnelPushBootstrap />
      <PersonnelNotificationPermissionPrompt />
      {children}
    </>
  );
}
