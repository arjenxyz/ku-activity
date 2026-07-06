'use client';

import { createContext, useCallback, useContext, useLayoutEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { fetchPersonnelUnlockContext } from '@/lib/personnel-session-check';
import {
  clearPendingRegistration,
  loadPendingRegistration,
  savePendingRegistration,
} from '@/lib/registration-pending-storage';

type SessionGateContextValue = {
  /** Intro bitti — yönlendirme bekleniyorsa true döner (içerik gösterme) */
  onIntroComplete: () => boolean;
};

const SessionGateContext = createContext<SessionGateContextValue | null>(null);

export function usePersonnelSessionGate() {
  return useContext(SessionGateContext);
}

function isPersonnelPublicPath(pathname: string) {
  return (
    pathname.startsWith('/personnel-panel/login') ||
    pathname.startsWith('/personnel-panel/unlock') ||
    pathname.startsWith('/personnel-panel/basvuru') ||
    pathname.startsWith('/personnel-panel/sifremi-unuttum') ||
    pathname.startsWith('/personnel-panel/pin-sifirla') ||
    pathname.startsWith('/personnel-panel/kapanis/hizlandirma')
  );
}

function isProtectedPersonnelRoute(pathname: string) {
  return pathname.startsWith('/personnel-panel') && !isPersonnelPublicPath(pathname);
}

function shouldSkipIntro(pathname: string) {
  return (
    pathname.startsWith('/personnel-panel/basvuru') ||
    pathname.startsWith('/personnel-panel/login') ||
    pathname.startsWith('/personnel-panel/unlock')
  );
}

function resolveSessionRedirect(
  pathname: string,
  ctx: Awaited<ReturnType<typeof fetchPersonnelUnlockContext>>
): string | null {
  const isLogin = pathname.startsWith('/personnel-panel/login');
  const isUnlock = pathname.startsWith('/personnel-panel/unlock');
  const isProtected = isProtectedPersonnelRoute(pathname);

  if (ctx?.unlocked) {
    if (isLogin || isUnlock) return '/personnel-panel';
    return null;
  }
  if (ctx) {
    if (isLogin || isProtected) return '/personnel-panel/unlock';
    return null;
  }
  if (isUnlock || isProtected) return '/personnel-panel/login';
  return null;
}

async function resolvePendingRegistrationRedirect(): Promise<string | null> {
  const pending = loadPendingRegistration();
  if (!pending) return null;

  try {
    const res = await fetch(
      `/api/public/personnel-registration/status?kod=${encodeURIComponent(pending.verificationCode)}`
    );
    if (res.ok) {
      const data = (await res.json()) as { status?: string };
      if (data.status === 'pending' || data.status === 'approved' || data.status === 'rejected') {
        savePendingRegistration(pending);
        return '/personnel-panel/basvuru';
      }
    }
    clearPendingRegistration();
  } catch {
    /* girişe devam */
  }
  return null;
}

/**
 * Intro görünürken arka planda sessiz oturum kontrolü.
 * Yönlendirme intro bittikten sonra (veya auth rotalarında hemen) uygulanır.
 */
export function PersonnelSessionGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const skipIntro = shouldSkipIntro(pathname);
  const isAuthPath = isPersonnelPublicPath(pathname);

  const [sessionReady, setSessionReady] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);
  const [introComplete, setIntroComplete] = useState(skipIntro);

  useLayoutEffect(() => {
    let cancelled = false;
    setSessionReady(false);
    setPendingRedirect(null);
    setIntroComplete(skipIntro);

    void (async () => {
      const ctx = await fetchPersonnelUnlockContext();
      if (cancelled) return;

      if (!ctx) {
        const pendingRedirectUrl = await resolvePendingRegistrationRedirect();
        if (cancelled) return;
        if (pendingRedirectUrl) {
          setPendingRedirect(pendingRedirectUrl);
          setSessionReady(true);
          return;
        }
      }

      setPendingRedirect(resolveSessionRedirect(pathname, ctx));
      setSessionReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, skipIntro]);

  useLayoutEffect(() => {
    if (!sessionReady || !pendingRedirect) return;
    if (!skipIntro && !introComplete) return;
    window.location.replace(pendingRedirect);
  }, [sessionReady, pendingRedirect, skipIntro, introComplete]);

  const onIntroComplete = useCallback(() => {
    setIntroComplete(true);
    return Boolean(pendingRedirect);
  }, [pendingRedirect]);

  const holdAuthWhileChecking = isAuthPath && !sessionReady;
  const holdAuthRedirect = isAuthPath && sessionReady && Boolean(pendingRedirect);

  const showChildren = isAuthPath ? !holdAuthWhileChecking && !holdAuthRedirect : true;

  return (
    <SessionGateContext.Provider value={{ onIntroComplete }}>
      {showChildren ? children : null}
    </SessionGateContext.Provider>
  );
}
