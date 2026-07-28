'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type PersonnelNotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  data?: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
};

const VISIBLE_POLL_MS = 30_000;
const HIDDEN_POLL_MS = 60_000;
const STREAM_RECONNECT_MS = 1_500;

function mergeNotificationItems(
  prev: PersonnelNotificationItem[],
  incoming: PersonnelNotificationItem[]
): PersonnelNotificationItem[] {
  if (!incoming.length) return prev;
  const map = new Map(prev.map((item) => [item.id, item]));
  for (const item of incoming) {
    map.set(item.id, { ...map.get(item.id), ...item });
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function usePersonnelNotifications() {
  const [items, setItems] = useState<PersonnelNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollMsRef = useRef(VISIBLE_POLL_MS);
  const streamRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<number | undefined>(undefined);

  const applyPayload = useCallback((data: { items: PersonnelNotificationItem[]; unreadCount: number }) => {
    setItems(data.items ?? []);
    setUnreadCount(data.unreadCount ?? 0);
    setError(null);
  }, []);

  const refresh = useCallback(async () => {
    try {
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/personnel-panel/demo')) {
        const { getDemoNotifications } = await import('@/lib/demo/personnel-demo-data');
        const items = getDemoNotifications();
        applyPayload({
          items,
          unreadCount: items.filter((i) => !i.read_at).length,
        });
        return;
      }
      const res = await fetch('/api/personnel/notifications', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('load_failed');
      const data = (await res.json()) as {
        items: PersonnelNotificationItem[];
        unreadCount: number;
      };
      applyPayload(data);
    } catch {
      setError('load_failed');
    } finally {
      setLoading(false);
    }
  }, [applyPayload]);

  const mergeIncoming = useCallback((incoming: PersonnelNotificationItem[]) => {
    setItems((prev) => {
      const merged = mergeNotificationItems(prev, incoming);
      setUnreadCount(merged.filter((item) => !item.read_at).length);
      return merged;
    });
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();

    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/personnel-panel/demo')) {
      return;
    }

    const syncPollInterval = () => {
      pollMsRef.current = document.visibilityState === 'visible' ? VISIBLE_POLL_MS : HIDDEN_POLL_MS;
    };

    syncPollInterval();

    let intervalId = window.setInterval(() => void refresh(), pollMsRef.current);

    const resetInterval = () => {
      window.clearInterval(intervalId);
      intervalId = window.setInterval(() => void refresh(), pollMsRef.current);
    };

    const closeStream = () => {
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = undefined;
      }
      streamRef.current?.close();
      streamRef.current = null;
    };

    const openStream = () => {
      if (typeof EventSource === 'undefined') return;
      if (document.visibilityState !== 'visible') return;
      if (streamRef.current) return;

      const es = new EventSource('/api/personnel/notifications/stream');
      streamRef.current = es;

      es.addEventListener('notifications', (event) => {
        try {
          const payload = JSON.parse((event as MessageEvent).data) as {
            items?: PersonnelNotificationItem[];
          };
          if (payload.items?.length) mergeIncoming(payload.items);
        } catch {
          void refresh();
        }
      });

      es.addEventListener('reconnect', () => {
        closeStream();
        reconnectTimerRef.current = window.setTimeout(openStream, STREAM_RECONNECT_MS);
      });

      es.onerror = () => {
        closeStream();
        reconnectTimerRef.current = window.setTimeout(openStream, STREAM_RECONNECT_MS);
      };
    };

    const onVisibility = () => {
      syncPollInterval();
      resetInterval();
      if (document.visibilityState === 'visible') {
        void refresh();
        openStream();
      } else {
        closeStream();
      }
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
    openStream();

    return () => {
      window.clearInterval(intervalId);
      closeStream();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
      navigator.serviceWorker?.removeEventListener('message', onSwMessage);
    };
  }, [refresh, mergeIncoming]);

  const markRead = useCallback(async (id: string) => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/personnel-panel/demo')) {
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: n.read_at ?? new Date().toISOString() } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
      return;
    }
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
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/personnel-panel/demo')) {
      setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
      setUnreadCount(0);
      return;
    }
    const res = await fetch('/api/personnel/notifications/read-all', {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return;
    setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    setUnreadCount(0);
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/personnel-panel/demo')) {
      setItems((prev) => {
        const next = prev.filter((n) => n.id !== id);
        setUnreadCount(next.filter((n) => !n.read_at).length);
        return next;
      });
      return true;
    }
    const res = await fetch('/api/personnel/notifications', {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { unreadCount: number };
    setItems((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount(data.unreadCount ?? 0);
    return true;
  }, []);

  const clearAllNotifications = useCallback(async () => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/personnel-panel/demo')) {
      setItems([]);
      setUnreadCount(0);
      return true;
    }
    const res = await fetch('/api/personnel/notifications/clear', {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return false;
    setItems([]);
    setUnreadCount(0);
    return true;
  }, []);

  return {
    items,
    unreadCount,
    loading,
    error,
    refresh,
    markRead,
    markAllRead,
    deleteNotification,
    clearAllNotifications,
  };
};
