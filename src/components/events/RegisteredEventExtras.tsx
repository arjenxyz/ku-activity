'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiChevronDown, FiX } from 'react-icons/fi';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

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

/** Check-in boarding-pass modal + collapsible details for registered students. */
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

  const modal =
    mounted && qrOpen
      ? createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Check-in kartı"
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 px-3 py-5 backdrop-blur-md sm:px-5"
            onClick={() => setQrOpen(false)}
          >
            <div
              className="relative w-full max-w-[360px] overflow-hidden rounded-2xl bg-white shadow-2xl shadow-black/40"
              data-scroll-lock-allow=""
              onClick={(event) => event.stopPropagation()}
            >
              {/* Airline-style header */}
              <div className="relative bg-[#C70A2C] px-4 pb-4 pt-3 text-white">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/80">
                      Event check-in
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Kapat"
                    onClick={() => setQrOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
                  >
                    <FiX className="h-4 w-4" aria-hidden />
                  </button>
                </div>
                <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-white/75">
                  Yolcu / Passenger
                </p>
                <p className="mt-0.5 text-base font-semibold tracking-wide">
                  {passengerName.toLocaleUpperCase('tr-TR')}
                </p>
              </div>

              {/* Route strip */}
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-dashed border-slate-200 bg-slate-50 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    From
                  </p>
                  <p className="truncate text-sm font-bold text-[#0E1548]">{fromLabel}</p>
                </div>
                <div className="flex flex-col items-center px-1">
                  <span className="h-px w-8 bg-slate-300" aria-hidden />
                  <span className="my-1 text-[10px] font-semibold text-[#C70A2C]">●</span>
                  <span className="h-px w-8 bg-slate-300" aria-hidden />
                </div>
                <div className="min-w-0 text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    To
                  </p>
                  <p className="truncate text-sm font-bold text-[#0E1548]">{toLabel}</p>
                </div>
              </div>

              {/* Meta grid */}
              <div className="grid grid-cols-2 gap-px bg-slate-100">
                <div className="bg-white px-4 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Tarih
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-[#0E1548]">{dateLabel}</p>
                </div>
                <div className="bg-white px-4 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Kayıt no
                  </p>
                  <p className="mt-0.5 font-mono text-xs font-semibold text-[#0E1548]">
                    {registrationNo}
                  </p>
                </div>
              </div>

              {/* QR + stub */}
              <div className="relative px-4 py-4">
                <div
                  className="pointer-events-none absolute left-0 top-0 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-950/80"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute right-0 top-0 h-4 w-4 translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-950/80"
                  aria-hidden
                />
                <div className="border-t border-dashed border-slate-200 pt-4">
                  {loading ? (
                    <div className="mx-auto h-44 w-44 animate-pulse rounded-xl bg-slate-100" />
                  ) : error ? (
                    <p className="px-2 py-10 text-center text-sm text-red-600">{error}</p>
                  ) : qrSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={qrSrc}
                      alt="Check-in QR kodu"
                      width={200}
                      height={200}
                      className="mx-auto h-44 w-44 rounded-xl bg-white"
                    />
                  ) : null}

                  {manualCode && !loading && !error ? (
                    <div className="mt-3 text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Manuel kod
                      </p>
                      <p className="mt-1 font-mono text-xl font-bold tracking-[0.2em] text-[#0E1548]">
                        {manualCode}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="bg-[#FFF5F5] px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#C70A2C]">
                  Güvenlik uyarısı
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-700">
                  Bu boarding kartını yetkili personel dışında kimseyle paylaşmayın. Ekran görüntüsü
                  alınmasına veya fotoğraf çekilmesine izin vermeyin. QR ve manuel kodunuz;
                  güvenliğiniz, etkinlik süreçleriniz ve ödemeleriniz için kişiseldir.
                </p>
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
          Check-in’de yalnızca bu etkinliğe ait QR’ın geçerli. Başka etkinliğin kodu kabul edilmez.
        </p>
        <button
          type="button"
          onClick={() => setQrOpen(true)}
          className="mt-4 flex h-11 w-full items-center justify-center rounded-xl bg-[#C70A2C] text-sm font-bold uppercase tracking-wide text-white hover:bg-[#A80824]"
        >
          Check-in
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
