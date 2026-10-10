'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FiChevronDown, FiCopy } from 'react-icons/fi';

type Row = {
  id: string;
  eventId: string;
  eventTitle: string;
  location: string;
  registrationNo: string;
  status: string;
  statusLabel: string;
  canShowQr: boolean;
  canCancel: boolean;
  registeredAt: string;
  needsPayment?: boolean;
  feeLabel?: string | null;
  feeNotes?: string | null;
  paymentIban?: string | null;
  cashPaymentEnabled?: boolean;
  cashContactName?: string | null;
  cashContactNote?: string | null;
};

export function MyRegistrationsClient() {
  const searchParams = useSearchParams();
  const highlight = searchParams.get('highlight');
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [payOpenId, setPayOpenId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function load() {
    const response = await fetch('/api/registrations');
    const payload = (await response.json().catch(() => null)) as {
      registrations?: Row[];
      error?: string;
    } | null;
    if (!response.ok) {
      setError(payload?.error ?? 'Kayıtlar yüklenemedi');
      return;
    }
    setRows(payload?.registrations ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (highlight) setPayOpenId(highlight);
  }, [highlight]);

  async function cancel(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const response = await fetch(`/api/registrations/${id}`, { method: 'DELETE' });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(payload?.error ?? 'İptal başarısız');
        return;
      }
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function copyIban(id: string, iban: string) {
    try {
      await navigator.clipboard.writeText(iban.replace(/\s+/g, ''));
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setError('IBAN kopyalanamadı');
    }
  }

  return (
    <div className="space-y-3">
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {rows.length === 0 ? (
        <p className="rounded-2xl border border-slate-200/80 bg-white/70 px-5 py-6 text-center text-sm text-slate-600">
          Henüz kaydın yok.{' '}
          <Link href="/etkinlikler" className="font-medium text-[#2D6AF6] hover:underline">
            Etkinliklere bak
          </Link>
        </p>
      ) : null}
      {rows.map((row) => {
        const payOpen = payOpenId === row.id;
        return (
          <article
            key={row.id}
            className={`rounded-2xl border bg-white/70 px-5 py-4 ${
              highlight === row.id ? 'border-[#2D6AF6]' : 'border-slate-200/80'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-[#0E1548]">{row.eventTitle}</p>
                <p className="mt-1 text-sm text-slate-500">{row.registrationNo}</p>
              </div>
              <span className="shrink-0 rounded-full bg-[#e8f0ff] px-2.5 py-1 text-xs font-medium text-[#2D6AF6]">
                {row.statusLabel}
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-600">{row.location}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {row.needsPayment ? (
                <button
                  type="button"
                  aria-expanded={payOpen}
                  onClick={() => setPayOpenId(payOpen ? null : row.id)}
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-[#E8770A] px-3 py-2 text-sm font-medium text-white"
                >
                  Ücreti öde
                  {row.feeLabel ? ` · ${row.feeLabel}` : ''}
                  <FiChevronDown
                    className={`h-4 w-4 transition ${payOpen ? 'rotate-180' : ''}`}
                    aria-hidden
                  />
                </button>
              ) : null}
              {row.canShowQr ? (
                <Link
                  href={`/etkinlikler/${row.eventId}`}
                  className="rounded-2xl bg-[#0E1548] px-3 py-2 text-sm font-medium text-white"
                >
                  Geçiş kartı
                </Link>
              ) : null}
              <Link
                href={`/etkinlikler/${row.eventId}`}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-[#0E1548]"
              >
                Etkinlik
              </Link>
              {row.canCancel ? (
                <button
                  type="button"
                  disabled={busyId === row.id}
                  onClick={() => void cancel(row.id)}
                  className="rounded-2xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700"
                >
                  {busyId === row.id ? 'İptal…' : 'İptal et'}
                </button>
              ) : null}
            </div>

            {row.needsPayment && payOpen ? (
              <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-3.5">
                <p className="text-sm font-semibold text-[#0E1548]">
                  Ödeme tutarı {row.feeLabel}
                </p>
                {row.feeNotes ? (
                  <p className="text-sm leading-relaxed text-slate-600">{row.feeNotes}</p>
                ) : null}

                {row.paymentIban ? (
                  <div className="rounded-xl bg-white px-3 py-3 ring-1 ring-slate-200">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      IBAN
                    </p>
                    <p className="mt-1 break-all font-mono text-sm font-semibold text-[#0E1548]">
                      {row.paymentIban}
                    </p>
                    <button
                      type="button"
                      onClick={() => void copyIban(row.id, row.paymentIban!)}
                      className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-[#2D6AF6]"
                    >
                      <FiCopy className="h-3.5 w-3.5" aria-hidden />
                      {copiedId === row.id ? 'Kopyalandı' : 'IBAN kopyala'}
                    </button>
                  </div>
                ) : null}

                {row.cashPaymentEnabled ? (
                  <div className="rounded-xl bg-white px-3 py-3 ring-1 ring-slate-200">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Elden ödeme
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#0E1548]">
                      {row.cashContactName || 'Sorumlu ekip arkadaşı'}
                    </p>
                    {row.cashContactNote ? (
                      <p className="mt-1 text-sm text-slate-600">{row.cashContactNote}</p>
                    ) : (
                      <p className="mt-1 text-sm text-slate-600">
                        Ücreti etkinlik ekibindeki sorumlu kişiye elden teslim edebilirsiniz.
                      </p>
                    )}
                  </div>
                ) : null}

                {!row.paymentIban && !row.cashPaymentEnabled ? (
                  <p className="text-sm text-slate-600">
                    Ödeme bilgisi henüz eklenmedi. Organizasyon ekibiyle iletişime geçin.
                  </p>
                ) : null}
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
