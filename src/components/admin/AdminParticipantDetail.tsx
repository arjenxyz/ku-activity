'use client';

import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';
import { PAYMENT_STATUS_LABELS } from '@/lib/demo/data';
import { findParticipant, moneyTry, paymentTone } from '@/lib/demo/participants-ui';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3 last:border-0">
      <dt className="shrink-0 text-xs text-slate-400">{label}</dt>
      <dd className="min-w-0 text-right text-sm font-medium text-[#0E1548]">{value || '—'}</dd>
    </div>
  );
}

export function AdminParticipantDetail({
  eventId,
  registrationNo,
}: {
  eventId: string;
  registrationNo: string;
}) {
  const row = findParticipant(eventId, registrationNo);

  if (!row) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">Katılımcı bulunamadı.</p>
        <Link
          href={`/admin/participants/${eventId}`}
          className="text-sm font-medium text-[#2D6AF6] hover:underline"
        >
          Listeye dön
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-center gap-2">
        <Link
          href={`/admin/participants/${eventId}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#0E1548] hover:bg-slate-50"
          aria-label="Listeye dön"
        >
          <FiArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold text-[#0E1548]">{row.name}</h1>
          <p className="truncate text-xs text-slate-500">{row.registrationNo}</p>
        </div>
        <span className={`shrink-0 rounded-md px-2.5 py-1 text-[11px] font-semibold ${paymentTone(row.paymentStatus)}`}>
          {PAYMENT_STATUS_LABELS[row.paymentStatus]}
        </span>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-1 shadow-sm">
        <dl>
          <DetailRow label="Öğrenci no" value={row.studentNo} />
          <DetailRow label="Bölüm" value={row.department} />
          <DetailRow label="Sınıf" value={row.classYear} />
          <DetailRow label="Telefon" value={row.phone} />
          <DetailRow label="E-posta" value={row.email} />
          <DetailRow label="Etkinlik" value={row.event} />
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
