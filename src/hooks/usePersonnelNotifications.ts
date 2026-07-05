'use client';

import { useCallback, useEffect, useState } from 'react';

export type PersonnelNotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  read_at: string | null;
  created_at: string;
};

export function usePersonnelNotifications(pollMs = 60_000) {
  const [items, setItems] = useState<PersonnelNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/personnel/notifications', { credentials: 'include' });
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
    const id = window.setInterval(() => void refresh(), pollMs);
    return () => window.clearInterval(id);
  }, [pollMs, refresh]);

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
