'use client';

import { useState } from 'react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiArrowRight, FiDroplet, FiX } from 'react-icons/fi';
import type { CatalogEvent } from '@/lib/events/catalog';
import { emptyPlanning, formatFeeTry } from '@/lib/events/catalog';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

type Props = {
  event: CatalogEvent;
  isStudent: boolean;
  registrationOpen: boolean;
  seatsLeft: number;
  edgeVariant?: boolean;
};

export function JoinApplyButton({
  event,
  isStudent,
  registrationOpen,
  seatsLeft,
  edgeVariant = false,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [mounted, setMounted] = useState(false);

  useBodyScrollLock(authModalOpen || rulesModalOpen);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!authModalOpen && !rulesModalOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAuthModalOpen(false);
        setRulesModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [authModalOpen, rulesModalOpen]);

  const planning = event.planning ?? emptyPlanning();
  const fee = planning.pricing.feeAmount;
  const hasFee = typeof fee === 'number' && fee > 0;
  const edgeButtonClass =
    'flex w-14 flex-col items-center justify-center gap-1 rounded-l-2xl border border-r-0 border-emerald-200 bg-white/95 px-1.5 py-3 text-emerald-700 shadow-[0_8px_24px_rgba(15,23,42,0.14)] backdrop-blur-xl transition hover:bg-emerald-50 sm:w-16';

  async function apply() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          dayIds: event.days.map((day) => day.id),
          activityIds: [],
          logistics: {},
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        registration?: { id: string };
      } | null;
      if (!response.ok) {
        setError(payload?.error ?? 'Başvuru gönderilemedi');
        return;
      }
      setDone(true);
      router.refresh();
    } catch {
      setError('Başvuru gönderilemedi');
    } finally {
      setLoading(false);
    }
  }

  if (!isStudent) {
    return (
      <>
        <button
          type="button"
          onClick={() => setAuthModalOpen(true)}
          className={
            edgeVariant
              ? edgeButtonClass
              : 'flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#34d399] via-[#22c55e] to-[#16a34a] text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-emerald-500/25 transition hover:brightness-105'
          }
        >
          {edgeVariant ? (
            <>
              <FiDroplet className="h-5 w-5 fill-emerald-400 text-emerald-500" aria-hidden />
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] [writing-mode:vertical-rl]">
                Başvur
              </span>
            </>
          ) : (
            <>
              Başvur
              <FiArrowRight className="h-4 w-4" aria-hidden />
            </>
          )}
        </button>
        {mounted && authModalOpen
          ? createPortal(
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="auth-required-title"
                className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 px-4 backdrop-blur-md"
                onClick={() => setAuthModalOpen(false)}
              >
                <section
                  data-scroll-lock-allow=""
                  className="relative w-full max-w-md rounded-3xl bg-white p-6 text-slate-900 shadow-2xl ring-1 ring-slate-200 sm:p-8"
                  onClick={(event) => event.stopPropagation()}
                >
                  <button
                    type="button"
                    aria-label="Kapat"
                    onClick={() => setAuthModalOpen(false)}
                    className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[#0E1548] transition hover:bg-slate-100"
                  >
                    <FiX className="h-5 w-5" aria-hidden />
                  </button>
                  <div className="pr-8">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2D6AF6]">
                      Başvuru
                    </p>
                    <h2 id="auth-required-title" className="mt-2 text-xl font-bold text-[#0E1548]">
                      Önce hesabına giriş yapmalısın
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      Başvurabilmeniz için önce giriş yapmanız gerekmektedir.
                    </p>
                  </div>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <Link
                      href="/login"
                      onClick={() => setAuthModalOpen(false)}
                      className="inline-flex h-11 items-center justify-center rounded-xl bg-[#0E1548] px-4 text-sm font-semibold text-white shadow-md shadow-[#0E1548]/15 transition hover:bg-[#152060]"
                    >
                      Giriş yap
                    </Link>
                    <Link
                      href="/login?panel=register"
                      onClick={() => setAuthModalOpen(false)}
                      className="inline-flex h-11 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
                    >
                      Kayıt ol
                    </Link>
                  </div>
                </section>
              </div>,
              document.body
            )
          : null}
      </>
    );
  }

  if (!registrationOpen || seatsLeft <= 0) {
    return (
      <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Kayıt şu an kapalı veya kontenjan dolu.
      </p>
    );
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-4">
        <p className="text-sm font-semibold text-[#0E1548]">Başvurunuz alındı</p>
        {hasFee ? (
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Etkinlik ücreti {formatFeeTry(fee)}. Ödeme için{' '}
            <Link href="/kayitlarim" className="font-semibold text-[#2D6AF6] hover:underline">
              Etkinliklerim
            </Link>
            ’e gidin, bu etkinliği bulun ve <span className="font-semibold">Ücreti öde</span>{' '}
            bölümünü açın.
          </p>
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Bu etkinlik ücretsiz. Kayıtlarınızı{' '}
            <Link href="/kayitlarim" className="font-semibold text-[#2D6AF6] hover:underline">
              Etkinliklerim
            </Link>
            ’den takip edebilirsiniz.
          </p>
        )}
        <Link
          href="/kayitlarim"
          className="mt-4 flex h-11 w-full items-center justify-center rounded-xl bg-emerald-600 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700"
        >
          Etkinliklerime git
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className={edgeVariant ? '' : 'space-y-3'}>
        {!edgeVariant && error ? <p className="text-sm text-red-700">{error}</p> : null}
        {!edgeVariant && hasFee ? (
          <p className="text-sm text-slate-600">
            Katılım ücreti {formatFeeTry(fee)}. Başvurudan sonra ödeme adımlarını Etkinliklerim’de
            göreceksiniz.
          </p>
        ) : null}
        <button
          type="button"
          disabled={loading}
          onClick={() => (edgeVariant ? setRulesModalOpen(true) : void apply())}
          className={
            edgeVariant
              ? edgeButtonClass
              : 'flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#34d399] via-[#22c55e] to-[#16a34a] text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-emerald-500/25 transition hover:brightness-105 disabled:opacity-70'
          }
        >
          {edgeVariant ? (
            <>
              <FiDroplet className="h-5 w-5 fill-emerald-400 text-emerald-500" aria-hidden />
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] [writing-mode:vertical-rl]">
                Başvur
              </span>
            </>
          ) : (
            <>
              {loading ? 'Gönderiliyor…' : 'Katıl'}
              <FiArrowRight className="h-4 w-4" aria-hidden />
            </>
          )}
        </button>
      </div>
      {mounted && rulesModalOpen
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="application-rules-title"
              className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 px-4 backdrop-blur-md"
              onClick={() => setRulesModalOpen(false)}
            >
              <section
                data-scroll-lock-allow=""
                className="relative w-full max-w-lg rounded-3xl bg-white p-6 text-slate-900 shadow-2xl ring-1 ring-slate-200 sm:p-8"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  aria-label="Kapat"
                  onClick={() => setRulesModalOpen(false)}
                  className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[#0E1548] transition hover:bg-slate-100"
                >
                  <FiX className="h-5 w-5" aria-hidden />
                </button>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-600">
                  Başvuru öncesi bilgilendirme
                </p>
                <h2 id="application-rules-title" className="mt-2 pr-8 text-xl font-bold text-[#0E1548]">
                  Etkinlik bilgilerini onayla
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  Etkinliğin tüm detaylarını okudum. Etkinlik öncesinde bu bilgilerin değişebileceğini
                  ve güncel durumu sürekli kontrol etmem gerektiğini biliyorum.
                </p>
                <label className="mt-5 flex cursor-pointer gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <input
                    type="checkbox"
                    checked={rulesAccepted}
                    onChange={(event) => setRulesAccepted(event.target.checked)}
                    className="mt-0.5 h-5 w-5 shrink-0 accent-emerald-600"
                  />
                  <span className="text-sm font-medium leading-relaxed text-slate-700">
                    Okudum, anladım ve güncellemeleri takip edeceğim.
                  </span>
                </label>
                <button
                  type="button"
                  disabled={!rulesAccepted || loading}
                  onClick={() => {
                    setRulesModalOpen(false);
                    void apply();
                  }}
                  className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Gönderiliyor…' : 'Onayla ve başvur'}
                  <FiArrowRight className="h-4 w-4" aria-hidden />
                </button>
              </section>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
