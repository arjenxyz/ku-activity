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
            className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/80 px-4 py-6 backdrop-blur-md sm:items-center sm:px-5"
            onClick={() => setQrOpen(false)}
          >
            <div
              className="relative w-full max-w-sm overflow-hidden rounded-[1.5rem] bg-white shadow-2xl shadow-slate-900/30"
              data-scroll-lock-allow=""
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#0E1548]">Check-in QR</p>
                  <p className="truncate text-[11px] text-slate-500">Kayıt no {registrationNo}</p>
                </div>
                <button
                  type="button"
                  aria-label="Kapat"
                  onClick={() => setQrOpen(false)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
                >
                  <FiX className="h-4 w-4" aria-hidden />
                </button>
              </div>

              <div className="px-5 py-5">
                {loading ? (
                  <div className="mx-auto h-52 w-52 animate-pulse rounded-2xl bg-slate-100" />
                ) : error ? (
                  <p className="px-2 py-14 text-center text-sm text-red-600">{error}</p>
                ) : qrSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrSrc}
                    alt="Check-in QR kodu"
                    width={220}
                    height={220}
                    className="mx-auto h-52 w-52 rounded-2xl bg-white ring-1 ring-slate-100"
                  />
                ) : null}

                <div className="mt-5 rounded-2xl border border-amber-200/80 bg-amber-50 px-3.5 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800">
                    Güvenlik uyarısı
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-amber-950/85">
                    Bu ekranı yetkili personel dışında kimseyle paylaşmayın. Ekran görüntüsü alınmasına
                    veya fotoğraf çekilmesine izin vermeyin. QR kodunuz; güvenliğiniz, etkinlik
                    süreçleriniz ve ödemeleriniz için kişiseldir — yanlış ellere geçmesi sorun
                    oluşturabilir.
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
