'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  FiArrowLeft,
  FiCalendar,
  FiDownload,
  FiMapPin,
  FiUsers,
} from 'react-icons/fi';
import {
  DEMO_PARTICIPANTS,
  PAYMENT_STATUS_LABELS,
  type DemoParticipant,
  type PaymentStatus,
} from '@/lib/demo/data';
import type { CatalogEvent } from '@/lib/events/catalog';
import { formatFeeTry } from '@/lib/events/catalog';
import { downloadExcelCsv } from '@/lib/export/excel-csv';

type AdminEvent = CatalogEvent & { registeredCount?: number };
type ListFilter = 'all' | 'payment_open' | 'paid' | 'attended';

function moneyTry(amount: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(amount);
}

function bandFor(id: string) {
  if (id.includes('abana')) return 'from-[#0E1548] via-[#1a3a7a] to-[#2D6AF6]';
  if (id.includes('tanisma')) return 'from-[#0E1548] via-[#152060] to-[#3d5a9e]';
  return 'from-[#0E1548] to-[#2D6AF6]';
}

function paymentTone(status: PaymentStatus) {
  switch (status) {
    case 'paid':
      return 'text-emerald-700 bg-emerald-50';
    case 'pending':
      return 'text-amber-700 bg-amber-50';
    case 'partial':
      return 'text-sky-700 bg-sky-50';
    case 'waived':
      return 'text-slate-600 bg-slate-100';
  }
}

function statsFor(rows: DemoParticipant[]) {
  return {
    total: rows.length,
    paid: rows.filter((r) => r.paymentStatus === 'paid' || r.paymentStatus === 'waived').length,
    pending: rows.filter((r) => r.paymentStatus === 'pending' || r.paymentStatus === 'partial').length,
    attended: rows.filter((r) => r.attendance === 'Katıldı').length,
    collected: rows.reduce((sum, r) => sum + r.paidAmount, 0),
    expected: rows.reduce((sum, r) => sum + (r.paymentStatus === 'waived' ? 0 : r.paymentAmount), 0),
  };
}

function exportParticipants(eventTitle: string, rows: DemoParticipant[]) {
  const stamp = new Date().toISOString().slice(0, 10);
  const safe = eventTitle.replace(/[^\w\-ğüşıöçĞÜŞİÖÇ ]+/gi, '').trim().replace(/\s+/g, '-');
  downloadExcelCsv(
    `${safe || 'katilimcilar'}-${stamp}.csv`,
    [
      'Kayıt no',
      'Ad',
      'Öğrenci no',
      'Bölüm',
      'Sınıf',
      'Telefon',
      'E-posta',
      'Etkinlik',
      'Kayıt tarihi',
      'Katılım',
      'Gün',
      'Ödeme durumu',
      'Ücret (TRY)',
      'Ödenen (TRY)',
      'Ödeme yöntemi',
      'Ödeme notu',
    ],
    rows.map((row) => [
      row.registrationNo,
      row.name,
      row.studentNo,
      row.department,
      row.classYear,
      row.phone,
      row.email,
      row.event,
      row.registeredAt,
      row.attendance,
      row.day,
      PAYMENT_STATUS_LABELS[row.paymentStatus],
      row.paymentAmount,
      row.paidAmount,
      row.paymentMethod,
      row.paymentNote,
    ])
  );
}

const FILTERS: Array<{ key: ListFilter; label: string }> = [
  { key: 'all', label: 'Tümü' },
  { key: 'payment_open', label: 'Ödeme açık' },
  { key: 'paid', label: 'Ödendi' },
  { key: 'attended', label: 'Katıldı' },
];

export function AdminParticipantsPanel() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [ready, setReady] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<ListFilter>('all');

  useEffect(() => {
    void (async () => {
      const response = await fetch('/api/admin/events');
      const payload = (await response.json().catch(() => null)) as { events?: AdminEvent[] } | null;
      setEvents(payload?.events ?? []);
      setReady(true);
    })();
  }, []);

  const selected = events.find((event) => event.id === selectedId) ?? null;

  const eventRows = useMemo(() => {
    if (!selectedId) return [];
    return DEMO_PARTICIPANTS.filter((row) => row.eventId === selectedId);
  }, [selectedId]);

  const filteredRows = useMemo(() => {
    return eventRows.filter((row) => {
      if (filter === 'all') return true;
      if (filter === 'payment_open') {
        return row.paymentStatus === 'pending' || row.paymentStatus === 'partial';
      }
      if (filter === 'paid') {
        return row.paymentStatus === 'paid' || row.paymentStatus === 'waived';
      }
      return row.attendance === 'Katıldı';
    });
  }, [eventRows, filter]);

  const selectedStats = statsFor(eventRows);

  if (selected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedId(null);
              setFilter('all');
            }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#0E1548] hover:bg-slate-50"
            aria-label="Etkinlik listesine dön"
          >
            <FiArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold text-[#0E1548] sm:text-lg">{selected.title}</h1>
            <p className="truncate text-xs text-slate-500">
              {selectedStats.total} kayıt · {selectedStats.paid} ödendi · {moneyTry(selectedStats.collected)}
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              exportParticipants(selected.title, filter === 'all' ? eventRows : filteredRows)
            }
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#0E1548] px-3 py-2 text-xs font-semibold text-white hover:bg-[#152060]"
          >
            <FiDownload className="h-3.5 w-3.5" />
            Excel
          </button>
        </div>

        <div className="flex gap-1.5 rounded-xl bg-slate-100/80 p-1">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={`flex-1 rounded-lg px-2 py-2 text-center text-[11px] font-semibold transition sm:text-xs ${
                filter === item.key
                  ? 'bg-white text-[#0E1548] shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white lg:hidden">
          {filteredRows.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500">Bu filtrede kayıt yok.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filteredRows.map((row) => (
                <li key={row.registrationNo} className="px-4 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-[#0E1548]">{row.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {row.registrationNo} · {row.studentNo}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-400">
                        {row.department} · Sn. {row.classYear}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold ${paymentTone(row.paymentStatus)}`}
                    >
                      {PAYMENT_STATUS_LABELS[row.paymentStatus]}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
                    <span>
                      {row.paidAmount === row.paymentAmount
                        ? moneyTry(row.paymentAmount)
                        : `${moneyTry(row.paidAmount)} / ${moneyTry(row.paymentAmount)}`}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span>
                      {row.attendance}
                      {row.day ? ` · ${row.day}` : ''}
                    </span>
                    {row.paymentMethod ? (
                      <>
                        <span className="text-slate-300">·</span>
                        <span>{row.paymentMethod}</span>
                      </>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="hidden overflow-x-auto rounded-2xl border border-slate-200/80 bg-white lg:block">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">Katılımcı</th>
                <th className="px-4 py-3">Bölüm</th>
                <th className="px-4 py-3">Ödeme</th>
                <th className="px-4 py-3">Tutar</th>
                <th className="px-4 py-3">Katılım</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={`desk-${row.registrationNo}`} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#0E1548]">{row.name}</p>
                    <p className="text-xs text-slate-500">
                      {row.registrationNo} · {row.studentNo}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {row.department}
                    <span className="block text-xs text-slate-400">Sn. {row.classYear}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${paymentTone(row.paymentStatus)}`}>
                      {PAYMENT_STATUS_LABELS[row.paymentStatus]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {row.paidAmount}/{row.paymentAmount} TRY
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {row.attendance}
                    <span className="block text-xs text-slate-400">{row.day}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

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
                <button
                  type="button"
                  onClick={() => setSelectedId(event.id)}
                  className="flex h-full w-full flex-col rounded-2xl border border-slate-200/80 bg-white text-left shadow-sm transition hover:border-[#2D6AF6]/30 hover:shadow-md"
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
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
