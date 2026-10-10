'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiChevronDown, FiInfo, FiX } from 'react-icons/fi';
import { MdFlight } from 'react-icons/md';
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

/** Short code for THY-style route endpoints. */
function routeCode(text: string, fallback: string) {
  const cleaned = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0].slice(0, 1) + words[1].slice(0, 2)).toUpperCase();
  }
  if (words[0]?.length >= 3) return words[0].slice(0, 3).toUpperCase();
  return fallback;
}

/** THY-style event entry card + collapsible details for registered students. */
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
  const fromLabel = location.split(',')[0]?.trim() || location;
  const toLabel = eventTitle;
  const fromCode = routeCode(fromLabel, 'LOC');
  const toCode = routeCode(toLabel, 'EVT');

  const modal =
    mounted && qrOpen
      ? createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Etkinlik kartı"
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 px-3 py-5 backdrop-blur-[2px] sm:px-5"
            onClick={() => setQrOpen(false)}
          >
            <div
              className="relative w-full max-w-[380px]"
              data-scroll-lock-allow=""
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <p className="text-sm font-bold tracking-[0.06em] text-white">
                  ETKİNLİK KARTI
                </p>
                <button
                  type="button"
                  aria-label="Kapat"
                  onClick={() => setQrOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
                >
                  <FiX className="h-4 w-4" aria-hidden />
                </button>
              </div>

              {/* Full red pass — THY layout */}
              <div className="overflow-hidden rounded-[1.25rem] bg-gradient-to-b from-[#E30613] via-[#C70A2C] to-[#6B0A1A] p-3 shadow-2xl shadow-black/50">
                <div className="flex items-center gap-2 px-1 pt-1 text-white">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-[10px] font-black">
                    {APP_SHORT_NAME}
                  </span>
                  <p className="truncate text-[12px] font-semibold tracking-wide">
                    {eventTitle}
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-start gap-1 px-1 text-white">
                  <div className="min-w-0">
                    <p className="text-[2.15rem] font-black leading-none tracking-tight">
                      {fromCode}
                    </p>
                    <p className="mt-1.5 truncate text-[11px] font-medium text-white/90">
                      {fromLabel}
                    </p>
                    <p className="mt-0.5 text-[11px] text-white/75">{dateLabel}</p>
                  </div>

                  <div className="flex flex-col items-center px-1.5 pt-1">
                    <p className="max-w-[7.5rem] truncate text-center text-[11px] font-bold tracking-wide">
                      {registrationNo}
                    </p>
                    <div className="mt-2 flex w-full min-w-[78px] items-center gap-1">
                      <span className="h-px flex-1 border-t border-dashed border-white/60" />
                      <MdFlight className="h-4 w-4 rotate-90 text-white" aria-hidden />
                      <span className="h-px flex-1 border-t border-dashed border-white/60" />
                    </div>
                    <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-white/80">
                      Giriş
                    </p>
                  </div>

                  <div className="min-w-0 text-right">
                    <p className="text-[2.15rem] font-black leading-none tracking-tight">
                      {toCode}
                    </p>
                    <p className="mt-1.5 truncate text-[11px] font-medium text-white/90">
                      {toLabel}
                    </p>
                    <p className="mt-0.5 text-[11px] text-white/75">Etkinlik</p>
                  </div>
                </div>

                {/* Passenger white card */}
                <div className="mt-4 rounded-xl bg-white px-3.5 py-3 shadow-sm">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Yolcu
                  </p>
                  <p className="mt-1 text-[1.05rem] font-black uppercase leading-snug tracking-wide text-[#111827]">
                    {passengerName.toLocaleUpperCase('tr-TR')}
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-slate-500">
                    {registrationNo} / ÖĞRENCİ
                  </p>
                </div>

                {/* Logistics + QR white card */}
                <div className="mt-2.5 rounded-xl bg-white px-3.5 py-3 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-3 gap-y-3.5">
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Yer
                        </p>
                        <p className="mt-0.5 truncate text-[15px] font-bold uppercase text-[#111827]">
                          {fromLabel}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Tarih
                        </p>
                        <p className="mt-0.5 text-[13px] font-bold uppercase leading-snug text-[#111827]">
                          {dateLabel}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Manuel
                        </p>
                        <p className="mt-0.5 font-mono text-[15px] font-black tracking-wide text-[#C70A2C]">
                          {loading ? '······' : (manualCode ?? '—')}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 rounded-lg bg-white p-1">
                      {loading ? (
                        <div className="h-[112px] w-[112px] animate-pulse rounded bg-slate-100" />
                      ) : error ? (
                        <div className="flex h-[112px] w-[112px] items-center justify-center px-2 text-center text-[10px] text-red-600">
                          {error}
                        </div>
                      ) : qrSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={qrSrc}
                          alt="Giriş QR kodu"
                          width={112}
                          height={112}
                          className="h-[112px] w-[112px] bg-white"
                        />
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-3 flex items-start gap-2 border-t border-slate-100 pt-2.5">
                    <FiInfo className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#C70A2C]" aria-hidden />
                    <p className="text-[11px] leading-snug text-slate-600">
                      Bu kartı yalnızca yetkili personele gösterin.
                    </p>
                  </div>
                </div>

                <div className="mt-3 px-1 pb-1 text-center">
                  <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-white/85">
                    {APP_SHORT_NAME} · Event check-in
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
