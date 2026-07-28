'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  usePersonnelNotifications,
  type PersonnelNotificationItem,
} from '@/hooks/usePersonnelNotifications';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { resolvePersonnelNotificationCopy } from '@/lib/personnel-notification-i18n';
import { PersonnelInAppNotificationBanner } from '@/components/personnel/PersonnelInAppNotificationBanner';
import { playInAppNotificationSound } from '@/lib/in-app-notification-sound';
import { isNotificationsMuted } from '@/lib/personnel-notification-storage';

export type InAppToast = {
  id: string;
  title: string;
  body: string;
  href: string | null;
};

type PersonnelNotificationsContextValue = ReturnType<typeof usePersonnelNotifications> & {
  panelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
  toast: InAppToast | null;
  dismissToast: () => void;
};

const PersonnelNotificationsContext = createContext<PersonnelNotificationsContextValue | null>(
  null
);

function toToast(
  locale: Parameters<typeof resolvePersonnelNotificationCopy>[0],
  item: PersonnelNotificationItem
): InAppToast {
  const copy = resolvePersonnelNotificationCopy(locale, item);
  return {
    id: item.id,
    title: copy.title,
    body: copy.body,
    href: item.href,
  };
}

export function PersonnelNotificationsProvider({ children }: { children: ReactNode }) {
  const { locale } = useLocale();
  const notifications = usePersonnelNotifications();
  const [panelOpen, setPanelOpen] = useState(false);
  const [toast, setToast] = useState<InAppToast | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);

  const dismissToast = useCallback(() => setToast(null), []);
  const openPanel = useCallback(() => {
    setPanelOpen(true);
    setToast(null);
  }, []);
  const closePanel = useCallback(() => setPanelOpen(false), []);

  const showToast = useCallback((next: InAppToast) => {
    if (isNotificationsMuted()) return;
    setToast((current) => {
      if (current?.id === next.id) return current;
      playInAppNotificationSound();
      return next;
    });
  }, []);

  useEffect(() => {
    if (notifications.loading) return;

    const currentIds = new Set(notifications.items.map((item) => item.id));

    if (!initializedRef.current) {
      seenIdsRef.current = currentIds;
      initializedRef.current = true;
      return;
    }

    if (document.visibilityState !== 'visible') {
      seenIdsRef.current = currentIds;
      return;
    }

    const fresh = notifications.items.find(
      (item) => !seenIdsRef.current.has(item.id) && !item.read_at
    );

    seenIdsRef.current = currentIds;

    if (fresh) {
      showToast(toToast(locale, fresh));
    }
  }, [notifications.items, notifications.loading, showToast, locale]);

  useEffect(() => {
    const onSwMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;
      const data = event.data as {
        type?: string;
        notification?: InAppToast;
      };

      if (data.type === 'crewledger-play-notification-sound') {
        playInAppNotificationSound();
        return;
      }

      if (data.type === 'crewledger-in-app-notification' && data.notification) {
        if (document.visibilityState !== 'visible') return;
        const n = data.notification;
        showToast({
          id: n.id || `push-${Date.now()}`,
          title: n.title,
          body: n.body,
          href: n.href ?? null,
        });
      }
    };

    navigator.serviceWorker?.addEventListener('message', onSwMessage);
    return () => navigator.serviceWorker?.removeEventListener('message', onSwMessage);
  }, [showToast]);

  const value = useMemo(
    () => ({
      ...notifications,
      panelOpen,
      openPanel,
      closePanel,
      toast,
      dismissToast,
    }),
    [notifications, panelOpen, openPanel, closePanel, toast, dismissToast]
  );

  return (
    <PersonnelNotificationsContext.Provider value={value}>
      {children}
      <PersonnelInAppNotificationBanner />
    </PersonnelNotificationsContext.Provider>
  );
}

export function usePersonnelNotificationsContext() {
  const ctx = useContext(PersonnelNotificationsContext);
  if (!ctx) {
    throw new Error('usePersonnelNotificationsContext must be used within PersonnelNotificationsProvider');
  }
  return ctx;
}
