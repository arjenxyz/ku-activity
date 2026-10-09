import {
  DEMO_PARTICIPANTS,
  PAYMENT_STATUS_LABELS,
  type DemoParticipant,
  type PaymentStatus,
} from '@/lib/demo/data';
import { downloadExcelCsv } from '@/lib/export/excel-csv';

export type ListFilter = 'all' | 'payment_open' | 'paid' | 'claimed' | 'attended';

export function moneyTry(amount: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function paymentTone(status: PaymentStatus) {
  switch (status) {
    case 'paid':
      return 'text-emerald-700 bg-emerald-50';
    case 'pending':
      return 'text-amber-700 bg-amber-50';
    case 'partial':
      return 'text-sky-700 bg-sky-50';
    case 'waived':
      return 'text-slate-600 bg-slate-100';
    case 'claimed':
      return 'text-indigo-700 bg-indigo-50';
    case 'rejected':
      return 'text-red-700 bg-red-50';
  }
}

export function bandFor(id: string) {
  if (id.includes('abana')) return 'from-[#0E1548] via-[#1a3a7a] to-[#2D6AF6]';
  if (id.includes('tanisma')) return 'from-[#0E1548] via-[#152060] to-[#3d5a9e]';
  return 'from-[#0E1548] to-[#2D6AF6]';
}

export function statsFor(rows: DemoParticipant[]) {
  return {
    total: rows.length,
    paid: rows.filter((r) => r.paymentStatus === 'paid' || r.paymentStatus === 'waived').length,
    pending: rows.filter(
      (r) =>
        r.paymentStatus === 'pending' ||
        r.paymentStatus === 'partial' ||
        r.paymentStatus === 'rejected'
    ).length,
    claimed: rows.filter((r) => r.paymentStatus === 'claimed').length,
    attended: rows.filter((r) => r.attendance === 'Katıldı').length,
    collected: rows.reduce((sum, r) => sum + r.paidAmount, 0),
    expected: rows.reduce((sum, r) => sum + (r.paymentStatus === 'waived' ? 0 : r.paymentAmount), 0),
  };
}

/** Seed snapshot only — live data comes from /api/payments/participants. */
export function participantsForEvent(eventId: string) {
  return DEMO_PARTICIPANTS.filter((row) => row.eventId === eventId);
}

export function findParticipant(eventId: string, registrationNo: string) {
  const decoded = decodeURIComponent(registrationNo);
  return DEMO_PARTICIPANTS.find(
    (row) => row.eventId === eventId && row.registrationNo === decoded
  ) ?? null;
}

export function filterParticipants(rows: DemoParticipant[], filter: ListFilter) {
  return rows.filter((row) => {
    if (filter === 'all') return true;
    if (filter === 'payment_open') {
      return (
        row.paymentStatus === 'pending' ||
        row.paymentStatus === 'partial' ||
        row.paymentStatus === 'rejected'
      );
    }
    if (filter === 'claimed') return row.paymentStatus === 'claimed';
    if (filter === 'paid') {
      return row.paymentStatus === 'paid' || row.paymentStatus === 'waived';
    }
    return row.attendance === 'Katıldı';
  });
}

export function exportParticipants(eventTitle: string, rows: DemoParticipant[]) {
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
      'Ödeme kodu',
      'Ödeme durumu',
      'Ücret (TRY)',
      'Ödenen (TRY)',
      'Ödeme yöntemi',
      'Ödeme notu',
      'Sorumlu yetkili',
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
      row.paymentCode,
      PAYMENT_STATUS_LABELS[row.paymentStatus],
      row.paymentAmount,
      row.paidAmount,
      row.paymentMethod,
      row.paymentNote,
      row.custodianName ?? '',
    ])
  );
}

export const PARTICIPANT_FILTERS: Array<{ key: ListFilter; label: string }> = [
  { key: 'all', label: 'Tümü' },
  { key: 'payment_open', label: 'Açık' },
  { key: 'claimed', label: 'İnceleme' },
  { key: 'paid', label: 'Ödendi' },
  { key: 'attended', label: 'Katıldı' },
];
