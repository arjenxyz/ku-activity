'use client';

import { useCallback, useEffect, useState } from 'react';
import { EventCard } from '@/components/events/EventCard';
import type { CatalogEvent } from '@/lib/events/catalog';

type DiscoverEvent = CatalogEvent & {
  registeredCount?: number;
};

type MineMap = Record<string, { needsPayment: boolean }>;

export function EventsDiscover({
  initialEvents,
  initialMine,
}: {
  initialEvents: DiscoverEvent[];
  initialMine: MineMap;
}) {
  const [events, setEvents] = useState(initialEvents);
  const [mine, setMine] = useState(initialMine);

  const refresh = useCallback(async () => {
    try {
      const [eventsRes, regsRes] = await Promise.all([
        fetch('/api/events', { cache: 'no-store' }),
        fetch('/api/registrations', { cache: 'no-store' }).catch(() => null),
      ]);
      const eventsPayload = (await eventsRes.json().catch(() => null)) as {
        events?: DiscoverEvent[];
      } | null;
      if (eventsRes.ok && eventsPayload?.events) {
        setEvents(eventsPayload.events);
      }

      if (regsRes?.ok) {
        const regsPayload = (await regsRes.json().catch(() => null)) as {
          registrations?: Array<{
            eventId: string;
            status?: string;
            needsPayment?: boolean;
          }>;
        } | null;
        const next: MineMap = {};
        for (const row of regsPayload?.registrations ?? []) {
          if (row.status === 'cancelled') continue;
          next[row.eventId] = { needsPayment: Boolean(row.needsPayment) };
        }
        setMine(next);
      }
    } catch {
      // keep last good snapshot
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), 4000);
    const onFocus = () => void refresh();
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh]);

  return (
    <>
      <header className="mx-auto max-w-lg text-center">
        <p className="inline-flex rounded-full bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-slate-200/80">
          Keşfet
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#0E1548]">Etkinlikler</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Yayındaki etkinlikler · {events.length} kayıt
        </p>
      </header>
      <ul className="mt-10 grid gap-5 sm:grid-cols-2">
        {events.length === 0 ? (
          <li className="col-span-full rounded-2xl border border-dashed border-slate-200/80 bg-white/80 px-5 py-10 text-center text-sm text-slate-500 shadow-sm">
            Şu an listelenecek etkinlik yok.
          </li>
        ) : (
          events.map((event) => {
            const my = mine[event.id];
            return (
              <EventCard
                key={event.id}
                event={event}
                alreadyIn={Boolean(my)}
                needsPayment={my?.needsPayment ?? false}
                taken={event.registeredCount ?? 0}
              />
            );
          })
        )}
      </ul>
    </>
  );
}
