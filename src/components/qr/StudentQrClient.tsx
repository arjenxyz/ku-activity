'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type RegOption = {
  id: string;
  eventId: string;
  eventTitle: string;
  registrationNo: string;
  canShowQr: boolean;
};

export function StudentQrClient({ demoHint }: { demoHint?: boolean }) {
  const searchParams = useSearchParams();
  const preferred = searchParams.get('registration');
  const lockedEventId = searchParams.get('event')?.trim() || null;
  const [regs, setRegs] = useState<RegOption[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(preferred);
  const [token, setToken] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState<string | null>(null);
  const [meta, setMeta] = useState<{
    registrationNo: string;
    eventTitle: string;
    eventId: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectable = useMemo(() => {
    const confirmed = regs.filter((row) => row.canShowQr);
    if (!lockedEventId) return confirmed;
    return confirmed.filter((row) => row.eventId === lockedEventId);
  }, [regs, lockedEventId]);

  useEffect(() => {
    void (async () => {
      const response = await fetch('/api/registrations');
      const payload = (await response.json().catch(() => null)) as {
        registrations?: RegOption[];
      } | null;
      const rows = payload?.registrations ?? [];
      setRegs(rows);

      const scoped = lockedEventId
        ? rows.filter((row) => row.eventId === lockedEventId && row.canShowQr)
        : rows.filter((row) => row.canShowQr);

      const first =
        scoped.find((row) => row.id === preferred) ?? scoped[0] ?? null;
      setSelectedId(first?.id ?? null);
    })();
  }, [preferred, lockedEventId]);

  useEffect(() => {
    if (!selectedId) {
      setToken(null);
      setManualCode(null);
      setMeta(null);
      return;
    }
    const reg = regs.find((row) => row.id === selectedId);
    if (lockedEventId && reg && reg.eventId !== lockedEventId) {
      setError('Bu QR bu etkinliğe ait değil');
      setToken(null);
      setManualCode(null);
      setMeta(null);
      return;
    }

    let cancelled = false;
    void (async () => {
      setError(null);
      const qs = lockedEventId
        ? `?eventId=${encodeURIComponent(lockedEventId)}`
        : '';
      const response = await fetch(`/api/registrations/${selectedId}/token${qs}`);
      const payload = (await response.json().catch(() => null)) as {
        token?: string;
        registrationNo?: string;
        manualCode?: string;
        eventId?: string;
        error?: string;
      } | null;
      if (cancelled) return;
      if (!response.ok || !payload?.token) {
        setError(payload?.error ?? 'QR yüklenemedi');
        setToken(null);
        setManualCode(null);
        return;
      }
      setToken(payload.token);
      setManualCode(payload.manualCode ?? null);
      setMeta({
        registrationNo: payload.registrationNo ?? reg?.registrationNo ?? '',
        eventTitle: reg?.eventTitle ?? '',
        eventId: payload.eventId ?? reg?.eventId ?? '',
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId, regs, lockedEventId]);

  if (selectable.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-slate-200/80 bg-white/70 px-6 py-8 text-center">
        <p className="text-sm text-slate-600">
          {lockedEventId
            ? 'Bu etkinlik için onaylı kayıt / QR bulunamadı.'
            : 'Onaylı kayıt bulunamadı.'}
        </p>
        <Link
          href={lockedEventId ? `/etkinlikler/${lockedEventId}` : '/etkinlikler'}
          className="mt-4 inline-flex text-sm font-medium text-[#2D6AF6] hover:underline"
        >
          Etkinliğe dön
        </Link>
      </div>
    );
  }

  const qrSrc = token ? `/api/qr?token=${encodeURIComponent(token)}` : null;
  const locked = Boolean(lockedEventId);

  return (
    <div className="mt-6 space-y-4">
      {demoHint ? (
        <p className="rounded-2xl bg-white/70 px-3 py-2 text-center text-xs font-medium text-[#0E1548]">
          Gerçek QR — içerik yalnızca check-in token; ad veya öğrenci no yok.
        </p>
      ) : null}
      {locked ? (
        <p className="rounded-2xl border border-[#2D6AF6]/20 bg-[#e8f0ff]/60 px-3 py-2 text-center text-xs font-medium text-[#0E1548]">
          Bu QR yalnızca <span className="font-semibold">{meta?.eventTitle || 'seçili etkinlik'}</span>{' '}
          check-in’inde geçerlidir.
        </p>
      ) : null}
      {!locked && selectable.length > 1 ? (
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
        {manualCode ? (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Manuel kod
            </p>
            <p className="mt-1 font-mono text-lg font-semibold tracking-[0.18em] text-[#0E1548]">
              {manualCode}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Kamera okumazsa görevliye bu kodu söyleyin
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
