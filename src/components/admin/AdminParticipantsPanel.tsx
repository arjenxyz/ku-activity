'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  FiArrowLeft,
  FiCalendar,
  FiDownload,
  FiMapPin,
  FiUsers,
  FiX,
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
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0">
      <dt className="shrink-0 text-xs text-slate-400">{label}</dt>
      <dd className="min-w-0 text-right text-sm font-medium text-[#0E1548]">{value || '—'}</dd>
    </div>
  );
}

function ParticipantDetailModal({
  row,
  onClose,
}: {
  row: DemoParticipant;
  onClose: () => void;
}) {
  useBodyScrollLock(true);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[#0E1548]/50 backdrop-blur-sm"
        aria-label="Kapat"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="participant-detail-title"
        className="relative z-10 max-h-[85dvh] w-full overflow-y-auto rounded-t-3xl border border-slate-200 bg-white shadow-xl sm:max-w-md sm:rounded-3xl"
        data-scroll-lock-allow=""
      >
        <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-slate-100 bg-white px-5 py-4">
          <div className="min-w-0">
            <h2 id="participant-detail-title" className="text-lg font-semibold text-[#0E1548]">
              {row.name}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">{row.registrationNo}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className={`rounded-md px-2 py-1 text-[11px] font-semibold ${paymentTone(row.paymentStatus)}`}>
              {PAYMENT_STATUS_LABELS[row.paymentStatus]}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Kapat"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>
        </div>

        <dl className="px-5 py-2">
          <DetailRow label="Öğrenci no" value={row.studentNo} />
          <DetailRow label="Bölüm" value={row.department} />
          <DetailRow label="Sınıf" value={row.classYear} />
          <DetailRow label="Telefon" value={row.phone} />
          <DetailRow label="E-posta" value={row.email} />
          <DetailRow label="Kayıt tarihi" value={row.registeredAt} />
          <DetailRow label="Katılım" value={`${row.attendance}${row.day ? ` · ${row.day}` : ''}`} />
          <DetailRow label="Ücret" value={moneyTry(row.paymentAmount)} />
          <DetailRow label="Ödenen" value={moneyTry(row.paidAmount)} />
          <DetailRow label="Ödeme yöntemi" value={row.paymentMethod} />
          <DetailRow label="Ödeme notu" value={row.paymentNote} />
        </dl>
      </div>
    </div>
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
  const [detail, setDetail] = useState<DemoParticipant | null>(null);

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
              setDetail(null);
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

        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
          {filteredRows.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500">Bu filtrede kayıt yok.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filteredRows.map((row) => (
                <li key={row.registrationNo}>
                  <button
                    type="button"
                    onClick={() => setDetail(row)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50"
                  >
                    <span className="min-w-0 truncate font-medium text-[#0E1548]">{row.name}</span>
                    <span
                      className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold ${paymentTone(row.paymentStatus)}`}
                    >
                      {PAYMENT_STATUS_LABELS[row.paymentStatus]}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {detail ? <ParticipantDetailModal row={detail} onClose={() => setDetail(null)} /> : null}
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
