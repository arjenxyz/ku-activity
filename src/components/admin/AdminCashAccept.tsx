'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { FiArrowLeft } from 'react-icons/fi';
import { moneyTry } from '@/lib/demo/participants-ui';

export function AdminCashAccept() {
  const pathname = usePathname() ?? '';
  const search = useSearchParams();
  const backHref = pathname.startsWith('/staff') ? '/staff' : '/admin/participants';
  const [token, setToken] = useState(search.get('token') ?? '');
  const [info, setInfo] = useState<{
    registrationNo: string;
    amount: number;
    eventId: string;
  } | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = search.get('token');
    if (t) setToken(t);
  }, [search]);

  useEffect(() => {
    if (!token) {
      setInfo(null);
      return;
    }
    void (async () => {
      const response = await fetch(`/api/payments/cash?token=${encodeURIComponent(token)}`);
      const payload = (await response.json().catch(() => null)) as {
        handoff?: { registrationNo: string; amount: number; eventId: string; consumedAt: string | null };
        error?: string;
      } | null;
      if (!response.ok || !payload?.handoff) {
        setInfo(null);
        return;
      }
      setInfo({
        registrationNo: payload.handoff.registrationNo,
        amount: payload.handoff.amount,
        eventId: payload.handoff.eventId,
      });
      if (payload.handoff.consumedAt) {
        setDone('Bu QR daha önce kullanılmış.');
      }
    })();
  }, [token]);

  async function accept() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/payments/cash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'accept',
          token,
          staffId: 'demo-staff',
          staffName: 'Demo Görevli',
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        participant?: { name: string };
      } | null;
      if (!response.ok) throw new Error(payload?.error ?? 'Teslim alınamadı');
      setDone(
        `${payload?.participant?.name ?? 'Katılımcı'} — elden teslim kaydedildi. Sorumluluk: Demo Görevli.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="flex items-center gap-2">
        <Link
          href={backHref}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white"
        >
          <FiArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-[#0E1548]">Elden teslim al</h1>
          <p className="text-xs text-slate-500">QR okuyunca admin onayı olmadan ödeme tamamlanır.</p>
        </div>
      </div>

      <label className="block text-sm">
        <span className="text-xs font-medium text-slate-500">Teslim token</span>
        <input
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono text-sm"
          value={token}
          onChange={(e) => {
            setToken(e.target.value.trim());
            setDone(null);
            setError(null);
          }}
          placeholder="ems_cash_…"
        />
      </label>

      {info ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
          <p className="font-medium text-[#0E1548]">{info.registrationNo}</p>
          <p className="mt-1 text-slate-600">Tutar: {moneyTry(info.amount)}</p>
        </div>
      ) : null}

      <button
        type="button"
        disabled={!token || busy || Boolean(done)}
        onClick={() => void accept()}
        className="w-full rounded-xl bg-emerald-600 px-3 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {busy ? 'Kaydediliyor…' : 'Parayı teslim aldım — sorumluluğu üstlen'}
      </button>

      {done ? <p className="text-sm text-emerald-700">{done}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
