'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
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
  studentNo?: string | null;
  eventTitle: string;
  location: string;
  dateLabel: string;
  passengerName: string;
  /** When true, CTA becomes pay link and pass modal stays closed. */
  needsPayment?: boolean;
  feeLabel?: string | null;
  children: React.ReactNode;
};

/** Ticket-style geçiş kartı modal (THY boarding-pass look, event content). */
export function RegisteredEventExtras({
  eventId,
  registrationId,
  registrationNo,
  studentNo = null,
  eventTitle,
  location,
  dateLabel,
  passengerName,
  needsPayment = false,
  feeLabel = null,
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
  const [ticketSplit, setTicketSplit] = useState(false);

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
    if (needsPayment) return;
    void loadPass({ silent: true });
  }, [loadPass, needsPayment]);

  useEffect(() => {
    if (!qrOpen || needsPayment) return;
    void loadPass();
    const timer = window.setInterval(() => {
      void loadPass({ silent: true });
    }, 2500);
    return () => window.clearInterval(timer);
  }, [qrOpen, loadPass, needsPayment]);

  useEffect(() => {
    if (!qrOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setQrOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [qrOpen]);

  const completed = Boolean(checkCard?.completed);

  useEffect(() => {
    if (!qrOpen) {
      setTicketSplit(false);
      return;
    }
    if (!completed) {
      setTicketSplit(false);
      return;
    }
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setTicketSplit(true);
      return;
    }
    setTicketSplit(false);
    const timer = window.setTimeout(() => setTicketSplit(true), 320);
    return () => window.clearTimeout(timer);
  }, [qrOpen, completed]);

  const qrSrc = token ? `/api/qr?token=${encodeURIComponent(token)}` : null;
  const fromLabel = location.split(',')[0]?.trim() || location;
  const cardTitle = completed ? 'Tamamlandı' : checkCard?.name || 'Geçiş kartı';
  const cardNumber =
    checkCard && checkCard.total > 0
      ? completed
        ? checkCard.total
        : checkCard.index + 1
      : null;

  const ticketTop = (
    <>
      <div className="flex items-center gap-2.5 px-0.5 pt-0.5 text-white">
        <span className="flex h-9 min-w-9 items-center justify-center rounded-full bg-white px-1.5 text-[12px] font-black tracking-tight text-[#C70A2C]">
          {cardNumber != null ? `#${cardNumber}` : '#'}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70">
            {eventTitle}
          </p>
          <p className="truncate text-[15px] font-bold leading-tight">{cardTitle}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 px-0.5 text-white">
        <div className="min-w-0">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/65">Yer</p>
          <p className="mt-0.5 truncate text-base font-bold">{fromLabel}</p>
        </div>
        <div className="min-w-0 text-right">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/65">Tarih</p>
          <p className="mt-0.5 text-[13px] font-bold leading-snug">{dateLabel}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-white px-4 py-3.5 shadow-sm">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          Katılımcı
        </p>
        <p className="mt-1 text-[1.15rem] font-black uppercase leading-snug tracking-wide text-[#111827]">
          {passengerName.toLocaleUpperCase('tr-TR')}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-600">
            {studentNo || '—'}
          </span>
          <span className="rounded-md bg-[#FFF1F2] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#C70A2C]">
            Öğrenci
          </span>
        </div>
      </div>
    </>
  );

  const ticketStub = completed ? (
    <div className="text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 ring-4 ring-emerald-50/80">
        <FiCheck className="h-6 w-6 text-emerald-600" aria-hidden />
      </div>
      <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">
        Tamamlandı
      </p>
      <p className="mt-1.5 text-lg font-black tracking-tight text-[#111827]">
        Etkinliği tamamladınız
      </p>
      <p className="mt-1.5 text-sm text-slate-600">Katılımınız için teşekkür ederiz.</p>
      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-left">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Durum
          </p>
          <p className="mt-0.5 text-sm font-bold text-emerald-600">Onaylandı</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Kayıt no
          </p>
          <p className="mt-0.5 font-mono text-sm font-bold text-[#111827]">{registrationNo}</p>
        </div>
      </div>
    </div>
  ) : (
    <>
      <div className="flex items-start gap-3">
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-3 gap-y-3">
          <div className="col-span-2">
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Geçiş kartı
            </p>
            <p className="mt-0.5 text-[15px] font-bold text-[#111827]">{cardTitle}</p>
          </div>
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Yer
            </p>
            <p className="mt-0.5 truncate text-sm font-bold uppercase text-[#111827]">
              {fromLabel}
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
        <div className="shrink-0 rounded-xl border border-slate-100 bg-white p-1.5">
          {loading ? (
            <div className="h-[108px] w-[108px] animate-pulse rounded-lg bg-slate-100" />
          ) : error ? (
            <div className="flex h-[108px] w-[108px] items-center justify-center px-2 text-center text-[10px] text-red-600">
              {error}
            </div>
          ) : qrSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrSrc}
              alt="Geçiş kartı QR kodu"
              width={108}
              height={108}
              className="h-[108px] w-[108px] bg-white"
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
  );

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
                <p className="text-sm font-bold tracking-[0.08em] text-white">ETKİNLİK KARTI</p>
                <button
                  type="button"
                  aria-label="Kapat"
                  onClick={() => setQrOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
                >
                  <FiX className="h-4 w-4" aria-hidden />
                </button>
              </div>

              {completed ? (
                <div className="relative perspective-[1200px]">
                  {/* Top half — clean edges after split (no dashed tear scratches) */}
                  <div
                    className={`origin-bottom bg-gradient-to-b from-[#E30613] via-[#C70A2C] to-[#A80824] px-3.5 pb-3.5 pt-3.5 shadow-xl shadow-black/30 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform ${
                      ticketSplit
                        ? '-translate-y-5 -rotate-[3.5deg] rounded-[1.35rem]'
                        : 'translate-y-0 rotate-0 rounded-t-[1.35rem]'
                    }`}
                  >
                    {ticketTop}
                  </div>

                  <div
                    className={`transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      ticketSplit ? 'h-4' : 'h-0'
                    }`}
                    aria-hidden
                  />

                  {/* Bottom half */}
                  <div
                    className={`origin-top bg-gradient-to-b from-[#A80824] via-[#8B061F] to-[#5C0818] px-3.5 pb-3.5 pt-3.5 shadow-xl shadow-black/35 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform ${
                      ticketSplit
                        ? 'translate-y-5 rotate-[3.5deg] rounded-[1.35rem]'
                        : 'translate-y-0 rotate-0 rounded-b-[1.35rem]'
                    }`}
                  >
                    <div className="rounded-2xl bg-white px-4 py-3.5 shadow-sm">{ticketStub}</div>
                    <div className="mt-3.5 flex items-center justify-center gap-2 px-1">
                      <span className="h-px w-6 bg-white/30" aria-hidden />
                      <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-white/85">
                        {APP_SHORT_NAME} · Geçiş kartları
                      </p>
                      <span className="h-px w-6 bg-white/30" aria-hidden />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative overflow-hidden rounded-[1.35rem] bg-gradient-to-b from-[#E30613] via-[#C70A2C] to-[#5C0818] p-3.5 shadow-2xl shadow-black/55">
                  {ticketTop}
                  <div className="relative my-3.5">
                    <div
                      className="pointer-events-none absolute -left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-black/75"
                      aria-hidden
                    />
                    <div
                      className="pointer-events-none absolute -right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-black/75"
                      aria-hidden
                    />
                    <div className="border-t border-dashed border-white/45" />
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3.5 shadow-sm">{ticketStub}</div>
                  <div className="mt-3.5 flex items-center justify-center gap-2 px-1">
                    <span className="h-px w-6 bg-white/30" aria-hidden />
                    <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-white/85">
                      {APP_SHORT_NAME} · Geçiş kartları
                    </p>
                    <span className="h-px w-6 bg-white/30" aria-hidden />
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div className="space-y-4 px-5 py-5 sm:px-6">
      {needsPayment ? (
        <Link
          href={`/kayitlarim?highlight=${encodeURIComponent(registrationId)}`}
          className="flex h-11 w-full items-center justify-center rounded-xl bg-[#E8770A] text-sm font-bold uppercase tracking-wide text-white hover:bg-[#CF6A09]"
        >
          Ücreti öde{feeLabel ? ` · ${feeLabel}` : ''}
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => setQrOpen(true)}
          className="flex h-11 w-full items-center justify-center rounded-xl bg-[#C70A2C] text-sm font-bold uppercase tracking-wide text-white hover:bg-[#A80824]"
        >
          {completed ? 'Teşekkürler' : checkCard?.name || 'Geçiş kartı'}
        </button>
      )}

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
      {needsPayment ? null : modal}
    </div>
  );
}
