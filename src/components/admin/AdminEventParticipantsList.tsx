'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiDownload } from 'react-icons/fi';
import { PAYMENT_STATUS_LABELS, type DemoParticipant } from '@/lib/demo/data';
import type { CatalogEvent } from '@/lib/events/catalog';
import {
  PARTICIPANT_FILTERS,
  exportParticipants,
  filterParticipants,
  moneyTry,
  paymentTone,
  statsFor,
  type ListFilter,
} from '@/lib/demo/participants-ui';

type AdminEvent = CatalogEvent & { registeredCount?: number };

export function AdminEventParticipantsList({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [event, setEvent] = useState<AdminEvent | null>(null);
  const [rows, setRows] = useState<DemoParticipant[]>([]);
  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState<ListFilter>('all');

  const load = useCallback(async () => {
    const [eventsRes, partsRes] = await Promise.all([
      fetch('/api/admin/events'),
      fetch(`/api/payments/participants?eventId=${encodeURIComponent(eventId)}`),
    ]);
    const eventsPayload = (await eventsRes.json().catch(() => null)) as {
      events?: AdminEvent[];
    } | null;
    const partsPayload = (await partsRes.json().catch(() => null)) as {
      participants?: DemoParticipant[];
    } | null;
    setEvent(eventsPayload?.events?.find((item) => item.id === eventId) ?? null);
    setRows(partsPayload?.participants ?? []);
    setReady(true);
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredRows = useMemo(() => filterParticipants(rows, filter), [rows, filter]);
  const selectedStats = statsFor(rows);

  if (ready && !event) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">Etkinlik bulunamadı.</p>
        <Link href="/admin/participants" className="text-sm font-medium text-[#2D6AF6] hover:underline">
          Katılımcılara dön
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.push('/admin/participants')}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#0E1548] hover:bg-slate-50"
          aria-label="Etkinlik listesine dön"
        >
          <FiArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold text-[#0E1548] sm:text-lg">
            {event?.title ?? '…'}
          </h1>
          <p className="truncate text-xs text-slate-500">
            {selectedStats.total} kayıt · {selectedStats.paid} ödendi
            {selectedStats.claimed > 0 ? ` · ${selectedStats.claimed} incelemede` : ''} ·{' '}
            {moneyTry(selectedStats.collected)}
          </p>
        </div>
        <button
          type="button"
          disabled={!event}
          onClick={() => {
            if (!event) return;
            exportParticipants(event.title, filter === 'all' ? rows : filteredRows);
          }}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#0E1548] px-3 py-2 text-xs font-semibold text-white hover:bg-[#152060] disabled:opacity-50"
        >
          <FiDownload className="h-3.5 w-3.5" />
          Excel
        </button>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100/80 p-1">
        {PARTICIPANT_FILTERS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setFilter(item.key)}
            className={`shrink-0 flex-1 rounded-lg px-2 py-2 text-center text-[11px] font-semibold transition sm:text-xs ${
              filter === item.key
                ? 'bg-white text-[#0E1548] shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
        {!ready ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500">Yükleniyor…</p>
        ) : filteredRows.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500">Bu filtrede kayıt yok.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filteredRows.map((row) => (
              <li key={row.registrationNo}>
                <Link
                  href={`/admin/participants/${eventId}/${encodeURIComponent(row.registrationNo)}`}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 transition hover:bg-slate-50"
                >
                  <span className="min-w-0 truncate font-medium text-[#0E1548]">{row.name}</span>
                  <span
                    className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold ${paymentTone(row.paymentStatus)}`}
                  >
                    {PAYMENT_STATUS_LABELS[row.paymentStatus]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap gap-3 text-xs">
        <Link href="/admin/payments/reviews" className="font-medium text-[#2D6AF6] hover:underline">
          Havale incelemeleri
        </Link>
        <Link
          href={`/admin/payments/custody?eventId=${encodeURIComponent(eventId)}`}
          className="font-medium text-[#2D6AF6] hover:underline"
        >
          Yetkili kasa / devir
        </Link>
      </div>
    </div>
  );
}
