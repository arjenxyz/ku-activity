'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiCalendar, FiChevronDown, FiInfo, FiMapPin, FiX } from 'react-icons/fi';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { APP_SHORT_NAME } from '@/lib/brand';

type Props = {
  eventId: string;
  registrationId: string;
  registrationNo: string;
  eventTitle: string;
  location: string;
  dateLabel: string;
  passengerName: string;
  children: React.ReactNode;
};

/** Check-in entry card modal + collapsible details for registered students. */
export function RegisteredEventExtras({
  eventId,
  registrationId,
  registrationNo,
  eventTitle,
  location,
  dateLabel,
  passengerName,
  children,
}: Props) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useBodyScrollLock(qrOpen);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!qrOpen) {
      setToken(null);
      setManualCode(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      const response = await fetch(
        `/api/registrations/${encodeURIComponent(registrationId)}/token?eventId=${encodeURIComponent(eventId)}`
      );
      const payload = (await response.json().catch(() => null)) as {
        token?: string;
        manualCode?: string;
        error?: string;
      } | null;
      if (cancelled) return;
      if (!response.ok || !payload?.token) {
        setError(payload?.error ?? 'QR yüklenemedi');
        setToken(null);
        setManualCode(null);
        setLoading(false);
        return;
      }
      setToken(payload.token);
      setManualCode(payload.manualCode ?? null);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [qrOpen, registrationId, eventId]);

  useEffect(() => {
    if (!qrOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setQrOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [qrOpen]);

  const qrSrc = token ? `/api/qr?token=${encodeURIComponent(token)}` : null;
  const nameParts = passengerName.trim().split(/\s+/).filter(Boolean);
  const initials = (
    nameParts.length >= 2
      ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`
      : passengerName.slice(0, 2)
  ).toLocaleUpperCase('tr-TR');

  const modal =
    mounted && qrOpen
      ? createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Etkinlik giriş kartı"
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 px-3 py-5 backdrop-blur-[2px] sm:px-5"
            onClick={() => setQrOpen(false)}
          >
            <div
              className="relative w-full max-w-[360px] overflow-hidden rounded-[1.35rem] bg-white shadow-2xl shadow-black/50"
              data-scroll-lock-allow=""
              onClick={(event) => event.stopPropagation()}
            >
              <div className="relative overflow-hidden bg-gradient-to-br from-[#0E1548] via-[#1a3a7a] to-[#2D6AF6] px-4 pb-5 pt-3.5 text-white">
                <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-sky-300/25 blur-3xl" />
                <div className="absolute -bottom-14 left-6 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute inset-0 opacity-[0.1] [background-image:radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] [background-size:14px_14px]" />

                <div className="relative flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
                      {APP_SHORT_NAME} · Giriş kartı
                    </p>
                    <h2 className="mt-2 text-xl font-bold leading-snug tracking-tight">
                      {eventTitle}
                    </h2>
                  </div>
                  <button
                    type="button"
                    aria-label="Kapat"
                    onClick={() => setQrOpen(false)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
                  >
                    <FiX className="h-4 w-4" aria-hidden />
                  </button>
                </div>

                <div className="relative mt-4 space-y-1.5 text-[12px] text-white/85">
                  <p className="flex items-center gap-1.5">
                    <FiCalendar className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                    <span>{dateLabel}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <FiMapPin className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                    <span className="truncate">{location}</span>
                  </p>
                </div>
              </div>

              <div className="px-4 py-4">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-gradient-to-r from-slate-50 to-white px-3 py-3">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0E1548] text-sm font-bold tracking-wide text-white"
                    aria-hidden
                  >
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Katılımcı
                    </p>
                    <p className="mt-0.5 truncate text-base font-bold tracking-tight text-[#0E1548]">
                      {passengerName}
                    </p>
                    <p className="mt-1 inline-flex max-w-full items-center rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-600">
                      {registrationNo}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-col items-center">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 ring-1 ring-slate-100">
                    {loading ? (
                      <div className="h-44 w-44 animate-pulse rounded-xl bg-slate-200/80" />
                    ) : error ? (
                      <div className="flex h-44 w-44 items-center justify-center px-3 text-center text-sm text-red-600">
                        {error}
                      </div>
                    ) : qrSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={qrSrc}
                        alt="Giriş QR kodu"
                        width={176}
                        height={176}
                        className="h-44 w-44 rounded-lg bg-white"
                      />
                    ) : null}
                  </div>

                  {manualCode && !loading && !error ? (
                    <div className="mt-3 text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Manuel kod
                      </p>
                      <p className="mt-1 font-mono text-xl font-bold tracking-[0.18em] text-[#C70A2C]">
                        {manualCode}
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#FFF5F5] px-3 py-2.5">
                  <FiInfo className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#C70A2C]" aria-hidden />
                  <p className="text-[11px] leading-snug text-slate-600">
                    Bu kartı yalnızca yetkili personele gösterin.
                  </p>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div className="space-y-4 px-5 py-5 sm:px-6">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-4">
        <p className="text-sm font-semibold text-[#0E1548]">Kayıtlısın</p>
        <p className="mt-0.5 text-xs text-slate-600">Kayıt no {registrationNo}</p>
        <p className="mt-2 text-sm text-slate-600">
          Girişte yalnızca bu etkinliğe ait QR’ın geçerli. Başka etkinliğin kodu kabul edilmez.
        </p>
        <button
          type="button"
          onClick={() => setQrOpen(true)}
          className="mt-4 flex h-11 w-full items-center justify-center rounded-xl bg-[#C70A2C] text-sm font-bold uppercase tracking-wide text-white hover:bg-[#A80824]"
        >
          Giriş kartı
        </button>
      </div>

      <button
        type="button"
        aria-expanded={detailsOpen}
        onClick={() => setDetailsOpen((value) => !value)}
        className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0E1548] hover:bg-slate-50"
      >
        {detailsOpen ? 'Daha az göster' : 'Daha fazla göster'}
        <FiChevronDown
          className={`h-4 w-4 transition ${detailsOpen ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {detailsOpen ? <div className="space-y-8 pt-1">{children}</div> : null}
      {modal}
    </div>
  );
}
