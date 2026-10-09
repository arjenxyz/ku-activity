'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiCalendar, FiChevronRight, FiMapPin, FiUsers } from 'react-icons/fi';
import type { DemoParticipant } from '@/lib/demo/data';
import type { CatalogEvent } from '@/lib/events/catalog';
import { formatFeeTry } from '@/lib/events/catalog';
import { bandFor, moneyTry, statsFor } from '@/lib/demo/participants-ui';

type AdminEvent = CatalogEvent & { registeredCount?: number };
type EventStats = ReturnType<typeof statsFor>;

/** Event cards — pick an event to manage participants. */
export function AdminParticipantsPanel() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [statsByEvent, setStatsByEvent] = useState<Record<string, EventStats>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      const response = await fetch('/api/admin/events');
      const payload = (await response.json().catch(() => null)) as { events?: AdminEvent[] } | null;
      const list = payload?.events ?? [];
      setEvents(list);

      const next: Record<string, EventStats> = {};
      await Promise.all(
        list.map(async (event) => {
          const partsRes = await fetch(
            `/api/payments/participants?eventId=${encodeURIComponent(event.id)}`
          );
          const partsPayload = (await partsRes.json().catch(() => null)) as {
            participants?: DemoParticipant[];
          } | null;
          next[event.id] = statsFor(partsPayload?.participants ?? []);
        })
      );
      setStatsByEvent(next);
      setReady(true);
    })();
  }, []);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-lg font-semibold tracking-tight text-[#0E1548]">Katılımcılar</h1>
        <p className="mt-1 text-sm text-slate-500">Etkinlik seç, listeyi yönet.</p>
      </header>

      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {!ready ? (
          <li className="rounded-2xl border border-slate-200/80 bg-white px-5 py-10 text-center text-sm text-slate-500 md:col-span-2 xl:col-span-3">
            Yükleniyor…
          </li>
        ) : events.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500 md:col-span-2 xl:col-span-3">
            Henüz etkinlik yok.
          </li>
        ) : (
          events.map((event) => {
            const stats = statsByEvent[event.id] ?? statsFor([]);
            const fee = event.planning?.pricing?.feeAmount;
            const dateLabel =
              event.startsAt === event.endsAt ? event.startsAt : `${event.startsAt} – ${event.endsAt}`;
            const statusBits = [
              `${stats.total} kayıt`,
              stats.pending > 0 ? `${stats.pending} ödeme açık` : null,
              stats.claimed > 0 ? `${stats.claimed} incelemede` : null,
            ].filter(Boolean);

            return (
              <li key={event.id}>
                <Link
                  href={`/admin/participants/${event.id}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white text-left shadow-sm transition hover:border-[#2D6AF6]/35 hover:shadow-md"
                >
                  <div className={`h-1 bg-gradient-to-r ${bandFor(event.id)}`} />
                  <div className="flex flex-1 flex-col gap-3.5 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-[15px] font-semibold leading-snug text-[#0E1548]">
                        {event.title}
                      </h2>
                      <FiChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-[#2D6AF6]" />
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-500">
                      <p className="flex items-center gap-1.5">
                        <FiMapPin className="h-3.5 w-3.5 shrink-0 text-[#2D6AF6]/80" />
                        <span className="truncate">{event.location}</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <FiCalendar className="h-3.5 w-3.5 shrink-0 text-[#2D6AF6]/80" />
                        <span className="truncate">{dateLabel}</span>
                      </p>
                    </div>

                    <div className="mt-auto space-y-1 border-t border-slate-100 pt-3">
                      <p className="flex items-center gap-1.5 text-sm font-medium text-[#0E1548]">
                        <FiUsers className="h-4 w-4 shrink-0 text-[#2D6AF6]" />
                        <span className="truncate">{statusBits.join(' · ')}</span>
                      </p>
                      <p className="pl-5 text-xs text-slate-400">
                        {fee == null ? 'Ücret yok' : formatFeeTry(fee)}
                        {stats.collected > 0 ? ` · ${moneyTry(stats.collected)} tahsil` : ''}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
