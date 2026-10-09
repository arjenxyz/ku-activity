'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FiCalendar,
  FiEdit2,
  FiMapPin,
  FiPlus,
  FiUsers,
  FiUserCheck,
} from 'react-icons/fi';
import { AdminStatusSelect } from '@/components/admin/AdminStatusSelect';
import type { CatalogEvent, CatalogEventStatus } from '@/lib/events/catalog';
import { STATUS_LABELS } from '@/lib/events/catalog';

type AdminEvent = CatalogEvent & { registeredCount?: number };
type FilterKey = 'all' | 'registration_open' | 'published' | 'other';

function bandFor(id: string) {
  if (id.includes('abana')) return 'from-[#0E1548] via-[#1a3a7a] to-[#2D6AF6]';
  if (id.includes('tanisma')) return 'from-[#0E1548] via-[#152060] to-[#3d5a9e]';
  return 'from-[#0E1548] to-[#2D6AF6]';
}

export function AdminEventsPanel() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [ready, setReady] = useState(false);

  async function load() {
    const response = await fetch('/api/admin/events');
    const payload = (await response.json().catch(() => null)) as { events?: AdminEvent[] } | null;
    setEvents(payload?.events ?? []);
    setReady(true);
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = events.filter((event) => {
    if (filter === 'all') return true;
    if (filter === 'other') {
      return event.status !== 'registration_open' && event.status !== 'published';
    }
    return event.status === filter;
  });

  async function setStatus(id: string, status: CatalogEventStatus) {
    setEvents((prev) =>
      prev.map((event) =>
        event.id === id ? { ...event, status, statusLabel: STATUS_LABELS[status] } : event
      )
    );
    const response = await fetch('/api/admin/events', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    if (!response.ok) {
      await load();
      return;
    }
    await load();
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="relative bg-gradient-to-br from-[#0E1548] via-[#152060] to-[#2D6AF6] px-4 py-3.5 text-white sm:px-5 sm:py-4">
          <div className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] [background-size:14px_14px]" />
          <div className="relative flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-lg font-semibold tracking-tight sm:text-xl">Etkinlikler</h1>
              <p className="mt-0.5 max-w-lg text-xs text-white/75">
                Listeyi yönet; oluşturma ve düzenleme ayrı sayfada.
              </p>
            </div>
            <Link
              href="/admin/events/new"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-600 sm:text-sm"
            >
              <FiPlus className="h-3.5 w-3.5" />
              Yeni etkinlik
            </Link>
          </div>
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
        {(
          [
            { key: 'all', label: 'Tümü' },
            { key: 'registration_open', label: 'Kayıt açık' },
            { key: 'published', label: 'Yayında' },
            { key: 'other', label: 'Diğer' },
          ] as const
        ).map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setFilter(item.key)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition sm:px-3.5 sm:py-2 ${
              filter === item.key
                ? 'bg-[#0E1548] text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <ul className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
        {!ready ? (
          <li className="rounded-2xl border border-slate-200 bg-white/70 px-5 py-8 text-center text-sm text-slate-500 md:col-span-2 xl:col-span-3">
            Yükleniyor…
          </li>
        ) : filtered.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-5 py-8 text-center text-sm text-slate-500 md:col-span-2 xl:col-span-3">
            Bu filtrede etkinlik yok.
          </li>
        ) : null}
        {ready
          ? filtered.map((event) => {
          const taken = event.registeredCount ?? 0;
          const fill = Math.min(100, Math.round((taken / Math.max(1, event.capacity)) * 100));
          const dateLabel =
            event.startsAt === event.endsAt ? event.startsAt : `${event.startsAt} – ${event.endsAt}`;
          return (
            <li
              key={event.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:border-[#2D6AF6]/25 hover:shadow-md"
            >
              <div className={`h-1.5 bg-gradient-to-r ${bandFor(event.id)}`} />
              <Link href={`/admin/events/${event.id}`} className="flex flex-1 flex-col gap-3 p-3.5 sm:p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold tracking-tight text-[#0E1548] sm:text-lg">
                      {event.title}
                    </h2>
                    <p className="mt-1.5 flex flex-col gap-1 text-xs text-slate-500 sm:mt-2">
                      <span className="inline-flex items-center gap-1.5">
                        <FiMapPin className="h-3.5 w-3.5 shrink-0 text-[#2D6AF6]" />
                        <span className="truncate">{event.location}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <FiCalendar className="h-3.5 w-3.5 shrink-0 text-[#2D6AF6]" />
                        <span className="truncate">{dateLabel}</span>
                      </span>
                    </p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-500">
                    {event.registrationPrefix}
                  </span>
                </div>

                <div className="mt-auto space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <FiUsers className="h-3.5 w-3.5" />
                      {taken}/{event.capacity}
                    </span>
                    {event.assignedToStaff ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700">
                        <FiUserCheck className="h-3.5 w-3.5" />
                        Görevli
                      </span>
                    ) : null}
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[#2D6AF6]"
                      style={{ width: `${Math.max(fill, taken > 0 ? 6 : 0)}%` }}
                    />
                  </div>
                </div>
              </Link>

              <div className="flex items-stretch gap-2 border-t border-slate-100 px-3.5 py-3 sm:px-4">
                <div className="min-w-0 flex-1">
                  <AdminStatusSelect
                    value={event.status}
                    onChange={(status) => void setStatus(event.id, status)}
                  />
                </div>
                <Link
                  href={`/admin/events/${event.id}/edit`}
                  className="inline-flex shrink-0 items-center gap-1.5 self-center rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-[#0E1548] transition hover:bg-[#e8f0ff]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <FiEdit2 className="h-3.5 w-3.5" />
                  Düzenle
                </Link>
              </div>
            </li>
          );
        })
          : null}
      </ul>
    </div>
  );
}
