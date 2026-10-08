'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

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
};

export function MyRegistrationsClient() {
  const searchParams = useSearchParams();
  const highlight = searchParams.get('highlight');
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

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
      {rows.map((row) => (
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
            {row.canShowQr ? (
              <Link
                href={`/qr?registration=${row.id}`}
                className="rounded-2xl bg-[#0E1548] px-3 py-2 text-sm font-medium text-white"
              >
                QR göster
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
        </article>
      ))}
    </div>
  );
}
