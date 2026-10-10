'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiChevronDown, FiMaximize, FiX } from 'react-icons/fi';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

type Props = {
  eventId: string;
  registrationId: string;
  registrationNo: string;
  children: React.ReactNode;
};

/** QR modal (this event only) + collapsible details for registered students. */
export function RegisteredEventExtras({
  eventId,
  registrationId,
  registrationNo,
  children,
}: Props) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useBodyScrollLock(qrOpen);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!qrOpen) {
      setToken(null);
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
        error?: string;
      } | null;
      if (cancelled) return;
      if (!response.ok || !payload?.token) {
        setError(payload?.error ?? 'QR yüklenemedi');
        setToken(null);
        setLoading(false);
        return;
      }
      setToken(payload.token);
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

  const modal =
    mounted && qrOpen
      ? createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Check-in QR kodu"
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/75 px-5 backdrop-blur-sm"
            onClick={() => setQrOpen(false)}
          >
            <div
              className="relative w-full max-w-[280px]"
              data-scroll-lock-allow=""
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                aria-label="Kapat"
                onClick={() => setQrOpen(false)}
                className="absolute -right-1 -top-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
              >
                <FiX className="h-5 w-5" aria-hidden />
              </button>
              <div className="rounded-3xl bg-white p-4 shadow-2xl">
                {loading ? (
                  <div className="mx-auto h-56 w-56 animate-pulse rounded-2xl bg-slate-100" />
                ) : error ? (
                  <p className="px-2 py-16 text-center text-sm text-red-600">{error}</p>
                ) : qrSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrSrc}
                    alt=""
                    width={240}
                    height={240}
                    className="mx-auto h-56 w-56 rounded-2xl bg-white"
                  />
                ) : null}
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
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0E1548] text-sm font-semibold text-white hover:bg-[#152060]"
        >
          <FiMaximize className="h-4 w-4" aria-hidden />
          Bu etkinliğin QR kodu
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
