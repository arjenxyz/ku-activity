'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type RegOption = {
  id: string;
  eventTitle: string;
  registrationNo: string;
  canShowQr: boolean;
};

export function StudentQrClient({ demoHint }: { demoHint?: boolean }) {
  const searchParams = useSearchParams();
  const preferred = searchParams.get('registration');
  const [regs, setRegs] = useState<RegOption[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(preferred);
  const [token, setToken] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ registrationNo: string; eventTitle: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectable = useMemo(() => regs.filter((row) => row.canShowQr), [regs]);

  useEffect(() => {
    void (async () => {
      const response = await fetch('/api/registrations');
      const payload = (await response.json().catch(() => null)) as { registrations?: RegOption[] } | null;
      const rows = payload?.registrations ?? [];
      setRegs(rows);
      const first =
        rows.find((row) => row.id === preferred && row.canShowQr) ??
        rows.find((row) => row.canShowQr) ??
        null;
      setSelectedId(first?.id ?? null);
    })();
  }, [preferred]);

  useEffect(() => {
    if (!selectedId) {
      setToken(null);
      setMeta(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      setError(null);
      const response = await fetch(`/api/registrations/${selectedId}/token`);
      const payload = (await response.json().catch(() => null)) as {
        token?: string;
        registrationNo?: string;
        error?: string;
      } | null;
      if (cancelled) return;
      if (!response.ok || !payload?.token) {
        setError(payload?.error ?? 'QR yüklenemedi');
        setToken(null);
        return;
      }
      setToken(payload.token);
      const reg = regs.find((row) => row.id === selectedId);
      setMeta({
        registrationNo: payload.registrationNo ?? reg?.registrationNo ?? '',
        eventTitle: reg?.eventTitle ?? '',
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId, regs]);

  if (selectable.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-slate-200/80 bg-white/70 px-6 py-8 text-center">
        <p className="text-sm text-slate-600">Onaylı kayıt bulunamadı.</p>
        <Link href="/etkinlikler" className="mt-4 inline-flex text-sm font-medium text-[#2D6AF6] hover:underline">
          Etkinliklere git
        </Link>
      </div>
    );
  }

  const qrSrc = token ? `/api/qr?token=${encodeURIComponent(token)}` : null;

  return (
    <div className="mt-6 space-y-4">
      {demoHint ? (
        <p className="rounded-2xl bg-white/70 px-3 py-2 text-center text-xs font-medium text-[#0E1548]">
          Gerçek QR — içerik yalnızca check-in token; ad veya öğrenci no yok.
        </p>
      ) : null}
      {selectable.length > 1 ? (
        <label className="block text-sm text-slate-600">
          Kayıt seç
          <select
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-[#0E1548]"
            value={selectedId ?? ''}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {selectable.map((row) => (
              <option key={row.id} value={row.id}>
                {row.eventTitle} · {row.registrationNo}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {error ? <p className="text-center text-sm text-red-700">{error}</p> : null}
      <div className="rounded-2xl border border-slate-200/80 bg-white/70 px-6 py-8 text-center">
        {qrSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrSrc}
            alt="Check-in QR kodu"
            width={220}
            height={220}
            className="mx-auto h-44 w-44 rounded-2xl bg-white p-2 shadow-sm ring-1 ring-slate-100"
          />
        ) : (
          <div className="mx-auto h-44 w-44 animate-pulse rounded-2xl bg-slate-100" />
        )}
        <p className="mt-4 text-sm font-semibold text-[#0E1548]">{meta?.registrationNo}</p>
        <p className="mt-1 text-xs text-slate-500">{meta?.eventTitle}</p>
      </div>
    </div>
  );
}
