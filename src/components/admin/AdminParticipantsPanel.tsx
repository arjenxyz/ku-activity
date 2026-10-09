'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  FiCalendar,
  FiCheckCircle,
  FiDownload,
  FiMapPin,
  FiUsers,
  FiCreditCard,
  FiClock,
  FiArrowLeft,
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
type ListFilter = 'all' | PaymentStatus | 'attended' | 'waiting';

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
      return 'bg-emerald-50 text-emerald-800 ring-emerald-100';
    case 'pending':
      return 'bg-amber-50 text-amber-800 ring-amber-100';
    case 'partial':
      return 'bg-sky-50 text-sky-800 ring-sky-100';
    case 'waived':
      return 'bg-slate-100 text-slate-600 ring-slate-200';
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
      if (filter === 'attended') return row.attendance === 'Katıldı';
      if (filter === 'waiting') return row.attendance === 'Bekliyor';
      return row.paymentStatus === filter;
    });
  }, [eventRows, filter]);

  const selectedStats = statsFor(eventRows);

  return (
    <div className="space-y-5 lg:space-y-6">
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="relative bg-gradient-to-br from-[#0E1548] via-[#152060] to-[#2D6AF6] px-4 py-3.5 text-white sm:px-5 sm:py-4">
          <div className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] [background-size:14px_14px]" />
          <div className="relative flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-lg font-semibold tracking-tight sm:text-xl">Katılımcılar</h1>
              <p className="mt-0.5 max-w-lg text-xs text-white/75">
                Etkinlik seç, ödemeleri gör, Excel olarak dışa aktar.
              </p>
            </div>
            {selected ? (
              <button
                type="button"
                onClick={() =>
                  exportParticipants(selected.title, filter === 'all' ? eventRows : filteredRows)
                }
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-600 sm:text-sm"
              >
                <FiDownload className="h-3.5 w-3.5" />
                Excel aktar
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {selected ? (
        <button
          type="button"
          onClick={() => {
            setSelectedId(null);
            setFilter('all');
          }}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#2D6AF6] hover:underline"
        >
          <FiArrowLeft className="h-4 w-4" />
          Etkinlik kartlarına dön
        </button>
      ) : null}

      {!selected ? (
        <ul className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
          {!ready ? (
            <li className="rounded-2xl border border-slate-200 bg-white/70 px-5 py-8 text-center text-sm text-slate-500 md:col-span-2 xl:col-span-3">
              Yükleniyor…
            </li>
          ) : events.length === 0 ? (
            <li className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-5 py-8 text-center text-sm text-slate-500 md:col-span-2 xl:col-span-3">
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
                    className="flex h-full w-full flex-col rounded-2xl border border-slate-200/80 bg-white text-left shadow-sm transition hover:border-[#2D6AF6]/25 hover:shadow-md"
                  >
                    <div className={`h-1.5 overflow-hidden rounded-t-2xl bg-gradient-to-r ${bandFor(event.id)}`} />
                    <div className="flex flex-1 flex-col gap-3 p-3.5 sm:p-4">
                      <div className="min-w-0">
                        <h2 className="truncate text-base font-semibold tracking-tight text-[#0E1548] sm:text-lg">
                          {event.title}
                        </h2>
                        <p className="mt-1.5 flex flex-col gap-1 text-xs text-slate-500">
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

                      <div className="mt-auto grid grid-cols-2 gap-2 text-xs">
                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 px-2.5 py-2 text-slate-600">
                          <FiUsers className="h-3.5 w-3.5 text-[#2D6AF6]" />
                          {stats.total}/{event.capacity}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-2.5 py-2 text-emerald-800">
                          <FiCreditCard className="h-3.5 w-3.5" />
                          {stats.paid} ödendi
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-2.5 py-2 text-amber-800">
                          <FiClock className="h-3.5 w-3.5" />
                          {stats.pending} bekliyor
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#e8f0ff] px-2.5 py-2 text-[#0E1548]">
                          <FiCheckCircle className="h-3.5 w-3.5" />
                          {stats.attended} check-in
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500">
                        Ücret: {fee == null ? 'Belirtilmedi' : formatFeeTry(fee)}
                        {stats.expected > 0 ? ` · Tahsilat ${moneyTry(stats.collected)}` : null}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : (
        <div className="space-y-4">
          <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-[#0E1548]">{selected.title}</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {selected.location} · {selected.startsAt}
                  {selected.endsAt !== selected.startsAt ? ` – ${selected.endsAt}` : ''}
                </p>
              </div>
              <span className="rounded-lg bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-500">
                {selected.registrationPrefix}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Kayıtlı</p>
                <p className="mt-0.5 text-lg font-semibold text-[#0E1548]">{selectedStats.total}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700/70">Ödeme tamam</p>
                <p className="mt-0.5 text-lg font-semibold text-emerald-800">{selectedStats.paid}</p>
              </div>
              <div className="rounded-xl bg-amber-50 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700/70">Ödeme açık</p>
                <p className="mt-0.5 text-lg font-semibold text-amber-800">{selectedStats.pending}</p>
              </div>
              <div className="rounded-xl bg-[#e8f0ff] px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#2D6AF6]/70">Tahsilat</p>
                <p className="mt-0.5 text-base font-semibold text-[#0E1548]">
                  {moneyTry(selectedStats.collected)}
                </p>
              </div>
            </div>
          </section>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {(
              [
                { key: 'all', label: 'Tümü' },
                { key: 'paid', label: 'Ödendi' },
                { key: 'pending', label: 'Ödeme bekliyor' },
                { key: 'partial', label: 'Kısmi' },
                { key: 'attended', label: 'Katıldı' },
                { key: 'waiting', label: 'Check-in yok' },
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

          {/* Mobile cards */}
          <ul className="space-y-3 lg:hidden">
            {filteredRows.length === 0 ? (
              <li className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
                Bu filtrede kayıt yok.
              </li>
            ) : (
              filteredRows.map((row) => (
                <li
                  key={row.registrationNo}
                  className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-[#0E1548]">{row.name}</p>
                      <p className="mt-0.5 text-xs font-medium text-[#2D6AF6]">{row.registrationNo}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-lg px-2 py-1 text-[11px] font-semibold ring-1 ${paymentTone(row.paymentStatus)}`}
                    >
                      {PAYMENT_STATUS_LABELS[row.paymentStatus]}
                    </span>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-slate-600">
                    <div>
                      <dt className="text-slate-400">Öğrenci no</dt>
                      <dd className="font-medium text-slate-800">{row.studentNo}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Sınıf</dt>
                      <dd className="font-medium text-slate-800">{row.classYear}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-slate-400">Bölüm</dt>
                      <dd className="font-medium text-slate-800">{row.department}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Ödeme</dt>
                      <dd className="font-medium text-slate-800">
                        {row.paidAmount}/{row.paymentAmount} TRY
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Katılım</dt>
                      <dd className="font-medium text-slate-800">
                        {row.attendance} · {row.day}
                      </dd>
                    </div>
                    {row.paymentNote ? (
                      <div className="col-span-2">
                        <dt className="text-slate-400">Not</dt>
                        <dd className="font-medium text-slate-800">{row.paymentNote}</dd>
                      </div>
                    ) : null}
                  </dl>
                </li>
              ))
            )}
          </ul>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-sm lg:block">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3">Kayıt no</th>
                  <th className="px-4 py-3">Ad</th>
                  <th className="px-4 py-3">Öğrenci</th>
                  <th className="px-4 py-3">Bölüm</th>
                  <th className="px-4 py-3">Ödeme</th>
                  <th className="px-4 py-3">Tutar</th>
                  <th className="px-4 py-3">Katılım</th>
                  <th className="px-4 py-3">Not</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                      Bu filtrede kayıt yok.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr key={row.registrationNo} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-medium text-[#0E1548]">{row.registrationNo}</td>
                      <td className="px-4 py-3 text-slate-800">{row.name}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {row.studentNo}
                        <span className="block text-xs text-slate-400">Sn. {row.classYear}</span>
                      </td>
                      <td className="max-w-[10rem] truncate px-4 py-3 text-slate-600">{row.department}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-lg px-2 py-1 text-[11px] font-semibold ring-1 ${paymentTone(row.paymentStatus)}`}
                        >
                          {PAYMENT_STATUS_LABELS[row.paymentStatus]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {row.paidAmount}/{row.paymentAmount}
                        {row.paymentMethod ? (
                          <span className="block text-xs text-slate-400">{row.paymentMethod}</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {row.attendance}
                        <span className="block text-xs text-slate-400">{row.day}</span>
                      </td>
                      <td className="max-w-[12rem] truncate px-4 py-3 text-xs text-slate-500">
                        {row.paymentNote || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
