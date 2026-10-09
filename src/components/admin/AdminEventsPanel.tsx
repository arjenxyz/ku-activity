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
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white shadow-sm">
        <div className="relative bg-gradient-to-br from-[#0E1548] via-[#152060] to-[#2D6AF6] px-5 py-6 text-white">
          <div className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] [background-size:14px_14px]" />
          <div className="relative flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Yönetim</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">Etkinlikler</h1>
              <p className="mt-2 max-w-md text-sm text-white/80">
                Listeyi yönet; oluşturma ve düzenleme ayrı sayfada.
              </p>
            </div>
            <Link
              href="/admin/events/new"
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
            >
              <FiPlus className="h-4 w-4" />
              Yeni etkinlik
            </Link>
          </div>
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto pb-1">
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
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              filter === item.key
                ? 'bg-[#0E1548] text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <ul className="grid gap-3">
        {!ready ? (
          <li className="rounded-2xl border border-slate-200 bg-white/70 px-5 py-8 text-center text-sm text-slate-500">
            Yükleniyor…
          </li>
        ) : filtered.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-5 py-8 text-center text-sm text-slate-500">
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
            <li key={event.id} className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <div className={`h-1.5 overflow-hidden rounded-t-2xl bg-gradient-to-r ${bandFor(event.id)}`} />
              <div className="space-y-2.5 p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold tracking-tight text-[#0E1548]">{event.title}</h2>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <FiMapPin className="h-3.5 w-3.5 text-[#2D6AF6]" />
                        {event.location}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <FiCalendar className="h-3.5 w-3.5 text-[#2D6AF6]" />
                        {dateLabel}
                      </span>
                    </p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-500">
                    {event.registrationPrefix}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <FiUsers className="h-3.5 w-3.5" />
                    {taken}/{event.capacity}
                  </span>
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-[#2D6AF6]" style={{ width: `${Math.max(fill, taken > 0 ? 6 : 0)}%` }} />
                  </div>
                  {event.assignedToStaff ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700">
                      <FiUserCheck className="h-3.5 w-3.5" />
                      Görevli
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <AdminStatusSelect
                    value={event.status}
                    onChange={(status) => void setStatus(event.id, status)}
                  />
                  <Link
                    href={`/admin/events/${event.id}/edit`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-[#0E1548] transition hover:bg-[#e8f0ff]"
                  >
                    <FiEdit2 className="h-3.5 w-3.5" />
                    Düzenle
                  </Link>
                </div>
              </div>
            </li>
          );
        })
          : null}
      </ul>
    </div>
  );
}
