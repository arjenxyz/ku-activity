'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { FiArrowLeft } from 'react-icons/fi';
import type { CustodyChannel, CustodyTransfer } from '@/lib/payments/types';
import { moneyTry } from '@/lib/demo/participants-ui';

type Holder = { staffId: string; staffName: string; amount: number; count: number };

export function AdminCustodyPanel() {
  const pathname = usePathname() ?? '';
  const search = useSearchParams();
  const eventId = search.get('eventId') ?? '';
  const backHref = pathname.startsWith('/staff')
    ? eventId
      ? `/staff/events/${eventId}`
      : '/staff'
    : eventId
      ? `/admin/events/${eventId}`
      : '/admin/events';
  const [holders, setHolders] = useState<Holder[]>([]);
  const [transfers, setTransfers] = useState<CustodyTransfer[]>([]);
  const [amount, setAmount] = useState('');
  const [channel, setChannel] = useState<CustodyChannel>('cash');
  const [note, setNote] = useState('');
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [acceptToken, setAcceptToken] = useState(search.get('token') ?? '');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch(`/api/payments/custody?eventId=${encodeURIComponent(eventId)}`);
    const payload = (await response.json().catch(() => null)) as {
      holders?: Holder[];
      transfers?: CustodyTransfer[];
    } | null;
    setHolders(payload?.holders ?? []);
    setTransfers(payload?.transfers ?? []);
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createTransfer() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch('/api/payments/custody', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          eventId,
          amount: Number(amount),
          channel,
          note,
          fromStaffId: 'demo-staff',
          fromStaffName: 'Demo Görevli',
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        transfer?: CustodyTransfer;
      } | null;
      if (!response.ok) throw new Error(payload?.error ?? 'Devir oluşturulamadı');
      setCreatedToken(payload?.transfer?.token ?? null);
      setMessage('Devir QR hazır — alıcı yetkili okusun.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata');
    } finally {
      setBusy(false);
    }
  }

  async function completeTransfer() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch('/api/payments/custody', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete',
          token: acceptToken,
          toStaffId: 'demo-admin',
          toStaffName: 'Demo Admin',
        }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error ?? 'Devir tamamlanamadı');
      setMessage('Sorumluluk yeni yetkiliye geçti.');
      setCreatedToken(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-center gap-2">
        <Link
          href={backHref}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white"
        >
          <FiArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-[#0E1548]">Kasa / yetkili devir</h1>
          <p className="text-xs text-slate-500">Elden veya IBAN — QR ile sorumluluk zinciri.</p>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Şu an sorumlu</p>
        {holders.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Kayıtlı kasa sorumlusu yok.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {holders.map((holder) => (
              <li key={holder.staffId} className="flex justify-between text-sm">
                <span className="font-medium text-[#0E1548]">{holder.staffName}</span>
                <span className="text-slate-600">
                  {moneyTry(holder.amount)} · {holder.count} kayıt
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4">
        <p className="text-sm font-semibold text-[#0E1548]">Yeni devir başlat</p>
        <input
          type="number"
          min={1}
          placeholder="Tutar (TRY)"
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <select
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          value={channel}
          onChange={(e) => setChannel(e.target.value as CustodyChannel)}
        >
          <option value="cash">Elden</option>
          <option value="bank_transfer">IBAN / havale</option>
        </select>
        <input
          placeholder="Not (opsiyonel)"
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button
          type="button"
          disabled={busy || !amount}
          onClick={() => void createTransfer()}
          className="w-full rounded-xl bg-[#0E1548] px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          Devir QR oluştur
        </button>
      </section>

      {createdToken ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/qr?token=${encodeURIComponent(createdToken)}`}
            alt="Devir QR"
            className="mx-auto h-40 w-40 rounded-2xl bg-white p-2"
          />
          <p className="mt-2 break-all font-mono text-[10px] text-emerald-900/70">{createdToken}</p>
        </div>
      ) : null}

      <section className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4">
        <p className="text-sm font-semibold text-[#0E1548]">Devir kabul et</p>
        <input
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono text-sm"
          placeholder="ems_custody_…"
          value={acceptToken}
          onChange={(e) => setAcceptToken(e.target.value.trim())}
        />
        <button
          type="button"
          disabled={busy || !acceptToken}
          onClick={() => void completeTransfer()}
          className="w-full rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          Sorumluluğu üstlen
        </button>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Geçmiş</p>
        <ul className="mt-2 divide-y divide-slate-100">
          {transfers.length === 0 ? (
            <li className="py-3 text-sm text-slate-500">Henüz devir yok.</li>
          ) : (
            transfers.slice(0, 8).map((row) => (
              <li key={row.id} className="py-2.5 text-xs text-slate-600">
                <span className="font-medium text-[#0E1548]">
                  {row.fromStaffName} → {row.toStaffName ?? '…'}
                </span>
                <span className="mt-0.5 block">
                  {moneyTry(row.amount)} · {row.channel === 'cash' ? 'Elden' : 'IBAN'} · {row.status}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>

      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
