'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiCalendar, FiMapPin, FiUsers } from 'react-icons/fi';
import { DEMO_PARTICIPANTS } from '@/lib/demo/data';
import type { CatalogEvent } from '@/lib/events/catalog';
import { formatFeeTry } from '@/lib/events/catalog';
import { bandFor, moneyTry, statsFor } from '@/lib/demo/participants-ui';

type AdminEvent = CatalogEvent & { registeredCount?: number };

/** Event cards — pick an event to manage participants. */
export function AdminParticipantsPanel() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      const response = await fetch('/api/admin/events');
      const payload = (await response.json().catch(() => null)) as { events?: AdminEvent[] } | null;
      setEvents(payload?.events ?? []);
      setReady(true);
    })();
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-[#0E1548]">Katılımcılar</h1>
        <p className="mt-0.5 text-sm text-slate-500">Etkinlik seçerek listeyi ve ödemeleri yönet.</p>
      </div>

      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {!ready ? (
          <li className="rounded-2xl border border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-500 md:col-span-2 xl:col-span-3">
            Yükleniyor…
          </li>
        ) : events.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-500 md:col-span-2 xl:col-span-3">
            Henüz etkinlik yok.
          </li>
        ) : (
          events.map((event) => {
            const rows = DEMO_PARTICIPANTS.filter((row) => row.eventId === event.id);
            const stats = statsFor(rows);
            const fee = event.planning?.pricing?.feeAmount;
            const dateLabel =
              event.startsAt === event.endsAt ? event.startsAt : `${event.startsAt} – ${event.endsAt}`;
            return (
              <li key={event.id}>
                <Link
                  href={`/admin/participants/${event.id}`}
                  className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white text-left shadow-sm transition hover:border-[#2D6AF6]/30 hover:shadow-md"
                >
                  <div className={`h-1 rounded-t-2xl bg-gradient-to-r ${bandFor(event.id)}`} />
                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <div>
                      <h2 className="text-base font-semibold text-[#0E1548]">{event.title}</h2>
                      <p className="mt-1.5 space-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <FiMapPin className="h-3.5 w-3.5 shrink-0 text-[#2D6AF6]" />
                          {event.location}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <FiCalendar className="h-3.5 w-3.5 shrink-0 text-[#2D6AF6]" />
                          {dateLabel}
                        </span>
                      </p>
                    </div>
                    <p className="mt-auto flex items-center gap-1.5 text-sm text-slate-600">
                      <FiUsers className="h-4 w-4 text-[#2D6AF6]" />
                      <span>
                        {stats.total} kayıt
                        {stats.pending > 0 ? ` · ${stats.pending} ödeme açık` : ''}
                      </span>
                    </p>
                    <p className="text-xs text-slate-400">
                      {fee == null ? 'Ücret yok' : formatFeeTry(fee)}
                      {stats.collected > 0 ? ` · ${moneyTry(stats.collected)} tahsil` : ''}
                    </p>
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
