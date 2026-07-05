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
import { PersonnelInAppNotificationBanner } from '@/components/personnel/PersonnelInAppNotificationBanner';

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

function toToast(item: Pick<PersonnelNotificationItem, 'id' | 'title' | 'body' | 'href'>): InAppToast {
  return {
    id: item.id,
    title: item.title,
    body: item.body,
    href: item.href,
  };
}

export function PersonnelNotificationsProvider({ children }: { children: ReactNode }) {
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
    setToast((current) => (current?.id === next.id ? current : next));
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
      showToast(toToast(fresh));
    }
  }, [notifications.items, notifications.loading, showToast]);

  useEffect(() => {
    const onSwMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;
      const data = event.data as { type?: string; notification?: InAppToast };

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
