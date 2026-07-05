'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type PersonnelNotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  read_at: string | null;
  created_at: string;
};

const VISIBLE_POLL_MS = 12_000;
const HIDDEN_POLL_MS = 60_000;

export function usePersonnelNotifications() {
  const [items, setItems] = useState<PersonnelNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollMsRef = useRef(VISIBLE_POLL_MS);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/personnel/notifications', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('load_failed');
      const data = (await res.json()) as {
        items: PersonnelNotificationItem[];
        unreadCount: number;
      };
      setItems(data.items ?? []);
      setUnreadCount(data.unreadCount ?? 0);
      setError(null);
    } catch {
      setError('load_failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();

    const syncPollInterval = () => {
      pollMsRef.current = document.visibilityState === 'visible' ? VISIBLE_POLL_MS : HIDDEN_POLL_MS;
    };

    syncPollInterval();

    let intervalId = window.setInterval(() => void refresh(), pollMsRef.current);

    const resetInterval = () => {
      window.clearInterval(intervalId);
      intervalId = window.setInterval(() => void refresh(), pollMsRef.current);
    };

    const onVisibility = () => {
      syncPollInterval();
      resetInterval();
      if (document.visibilityState === 'visible') void refresh();
    };

    const onFocus = () => void refresh();

    const onSwMessage = (event: MessageEvent) => {
      if (
        event.data &&
        typeof event.data === 'object' &&
        (event.data as { type?: string }).type === 'crewledger-notifications-refresh'
      ) {
        void refresh();
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);
    navigator.serviceWorker?.addEventListener('message', onSwMessage);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
      navigator.serviceWorker?.removeEventListener('message', onSwMessage);
    };
  }, [refresh]);

  const markRead = useCallback(async (id: string) => {
    const res = await fetch('/api/personnel/notifications', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { unreadCount: number };
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
    setUnreadCount(data.unreadCount ?? 0);
  }, []);

  const markAllRead = useCallback(async () => {
    const res = await fetch('/api/personnel/notifications/read-all', {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return;
    setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    setUnreadCount(0);
  }, []);

  return { items, unreadCount, loading, error, refresh, markRead, markAllRead };
}
