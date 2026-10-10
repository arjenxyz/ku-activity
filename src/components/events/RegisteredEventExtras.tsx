'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiCheck, FiChevronDown, FiInfo, FiX } from 'react-icons/fi';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { APP_SHORT_NAME } from '@/lib/brand';

type CheckCardState = {
  index: number;
  total: number;
  completed: boolean;
  name: string | null;
  id: string | null;
};

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

/** THY-style event check card + collapsible details for registered students. */
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
  const [checkCard, setCheckCard] = useState<CheckCardState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useBodyScrollLock(qrOpen);

  useEffect(() => setMounted(true), []);

  const loadPass = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) {
        setLoading(true);
        setError(null);
      }
      const response = await fetch(
        `/api/registrations/${encodeURIComponent(registrationId)}/token?eventId=${encodeURIComponent(eventId)}`
      );
      const payload = (await response.json().catch(() => null)) as {
        token?: string | null;
        manualCode?: string | null;
        error?: string;
        checkCard?: CheckCardState;
      } | null;
      if (!response.ok) {
        if (!opts?.silent) {
          setError(payload?.error ?? 'QR yüklenemedi');
          setToken(null);
          setManualCode(null);
          setLoading(false);
        }
        return;
      }
      setCheckCard(payload?.checkCard ?? null);
      if (payload?.checkCard?.completed) {
        setToken(null);
        setManualCode(null);
      } else {
        setToken(payload?.token ?? null);
        setManualCode(payload?.manualCode ?? null);
        if (!payload?.token && !opts?.silent) {
          setError(payload?.error ?? 'QR yüklenemedi');
        }
      }
      if (!opts?.silent) setLoading(false);
    },
    [registrationId, eventId]
  );

  useEffect(() => {
    void loadPass({ silent: true });
  }, [loadPass]);

  useEffect(() => {
    if (!qrOpen) return;
    void loadPass();
    const timer = window.setInterval(() => {
      void loadPass({ silent: true });
    }, 2500);
    return () => window.clearInterval(timer);
  }, [qrOpen, loadPass]);

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
  const cardTitle = checkCard?.completed
    ? 'Tamamlandı'
    : checkCard?.name || 'Check kartı';
  const cardStep =
    checkCard && checkCard.total > 0
      ? checkCard.completed
        ? `${checkCard.total}/${checkCard.total}`
        : `${checkCard.index + 1}/${checkCard.total}`
      : null;

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
                <div>
                  <p className="text-sm font-bold tracking-[0.06em] text-white">ETKİNLİK KARTI</p>
                  {cardStep ? (
                    <p className="mt-0.5 text-[11px] font-medium text-white/70">
                      Kart {cardStep}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  aria-label="Kapat"
                  onClick={() => setQrOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
                >
                  <FiX className="h-4 w-4" aria-hidden />
                </button>
              </div>

              <div className="overflow-hidden rounded-[1.25rem] bg-gradient-to-b from-[#E30613] via-[#C70A2C] to-[#6B0A1A] p-3 shadow-2xl shadow-black/50">
                <div className="flex items-center gap-2 px-1 pt-1 text-white">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-[10px] font-black">
                    {APP_SHORT_NAME}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-semibold tracking-wide">{eventTitle}</p>
                    <p className="truncate text-[11px] font-medium text-white/80">{cardTitle}</p>
                  </div>
                </div>

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

                <div className="mt-2.5 rounded-xl bg-white px-3.5 py-3 shadow-sm">
                  {checkCard?.completed ? (
                    <div className="flex flex-col items-center px-1 py-6 text-center">
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                        <FiCheck className="h-7 w-7" aria-hidden />
                      </span>
                      <p className="mt-3 text-base font-bold text-[#0E1548]">
                        Etkinliği tamamladınız
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">
                        Katılımınız için teşekkürler. Tüm check noktalarını başarıyla geçtiniz;
                        etkinliği sağ salim tamamladınız.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start gap-3">
                        <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-3 gap-y-3.5">
                          <div className="col-span-2">
                            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                              Check kart
                            </p>
                            <p className="mt-0.5 text-[15px] font-bold text-[#111827]">
                              {cardTitle}
                            </p>
                          </div>
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
                              alt="Check kart QR kodu"
                              width={112}
                              height={112}
                              className="h-[112px] w-[112px] bg-white"
                            />
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-2.5">
                        <FiInfo className="h-3.5 w-3.5 shrink-0 text-[#C70A2C]" aria-hidden />
                        <p className="text-[11px] leading-none text-slate-600">
                          Bu kartı yalnızca yetkili personele gösterin.
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-3 px-1 pb-1 text-center">
                  <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-white/85">
                    {APP_SHORT_NAME} · Check kart
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
          {checkCard?.completed
            ? 'Etkinliği tamamladınız. Katılımınız için teşekkürler.'
            : checkCard?.name
              ? `Şu an gösterilecek kart: ${checkCard.name}${
                  checkCard.total > 1 ? ` (${checkCard.index + 1}/${checkCard.total})` : ''
                }. Okutulunca sıradaki kart otomatik gelir.`
              : 'Check kartını yalnızca bu etkinlikte görevliye göster.'}
        </p>
        <button
          type="button"
          onClick={() => setQrOpen(true)}
          className="mt-4 flex h-11 w-full items-center justify-center rounded-xl bg-[#C70A2C] text-sm font-bold uppercase tracking-wide text-white hover:bg-[#A80824]"
        >
          {checkCard?.completed ? 'Teşekkürler' : checkCard?.name || 'Check kartı'}
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
