'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiArrowLeft, FiCopy, FiCreditCard, FiDollarSign, FiX } from 'react-icons/fi';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

type Method = 'transfer' | 'cash';

type Props = {
  open: boolean;
  onClose: () => void;
  paymentIban?: string | null;
  cashPaymentEnabled?: boolean;
  cashContactName?: string | null;
  cashContactNote?: string | null;
  registrationNo?: string;
};

export function FeePaymentModal({
  open,
  onClose,
  paymentIban = null,
  cashPaymentEnabled = false,
  cashContactName = null,
  cashContactNote = null,
  registrationNo,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [method, setMethod] = useState<Method | null>(null);
  const [copied, setCopied] = useState(false);

  useBodyScrollLock(open);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) {
      setMethod(null);
      setCopied(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (method) setMethod(null);
        else onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, method, onClose]);

  async function copyIban() {
    if (!paymentIban) return;
    try {
      await navigator.clipboard.writeText(paymentIban.replace(/\s+/g, ''));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  if (!mounted || !open) return null;

  const hasTransfer = Boolean(paymentIban);
  const hasCash = Boolean(cashPaymentEnabled);
  const hasAny = hasTransfer || hasCash;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Kapat"
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="fee-pay-title"
        className="relative z-[1] flex max-h-[min(92dvh,40rem)] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            {method ? (
              <button
                type="button"
                onClick={() => setMethod(null)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#2D6AF6] hover:bg-slate-100"
                aria-label="Geri"
              >
                <FiArrowLeft className="h-4 w-4" aria-hidden />
              </button>
            ) : null}
            <p id="fee-pay-title" className="truncate text-sm font-semibold text-[#0E1548]">
              {method === 'transfer'
                ? 'Havale / EFT'
                : method === 'cash'
                  ? 'Elden ödeme'
                  : 'Ödeme yöntemi seç'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
            aria-label="Kapat"
          >
            <FiX className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5">
          {!method ? (
            <div className="space-y-2.5">
              {hasTransfer ? (
                <button
                  type="button"
                  onClick={() => setMethod('transfer')}
                  className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-left transition hover:border-[#E8770A]/50 hover:bg-[#FFF8F0]"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF1E0] text-[#E8770A]">
                    <FiCreditCard className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="text-sm font-semibold text-[#0E1548]">Havale / EFT</span>
                </button>
              ) : null}
              {hasCash ? (
                <button
                  type="button"
                  onClick={() => setMethod('cash')}
                  className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-left transition hover:border-[#E8770A]/50 hover:bg-[#FFF8F0]"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF1E0] text-[#E8770A]">
                    <FiDollarSign className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="text-sm font-semibold text-[#0E1548]">Elden ödeme</span>
                </button>
              ) : null}
              {!hasAny ? (
                <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Ödeme bilgisi yok.
                </p>
              ) : null}
            </div>
          ) : null}

          {method === 'transfer' && paymentIban ? (
            <div className="space-y-3">
              <div className="rounded-2xl bg-slate-50 px-4 py-3.5 ring-1 ring-slate-200">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  IBAN
                </p>
                <p className="mt-1 break-all font-mono text-sm font-semibold text-[#0E1548]">
                  {paymentIban}
                </p>
                <button
                  type="button"
                  onClick={() => void copyIban()}
                  className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-[#2D6AF6]"
                >
                  <FiCopy className="h-3.5 w-3.5" aria-hidden />
                  {copied ? 'Kopyalandı' : 'Kopyala'}
                </button>
              </div>
              {registrationNo ? (
                <div className="rounded-2xl bg-slate-50 px-4 py-3.5 ring-1 ring-slate-200">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Açıklama
                  </p>
                  <p className="mt-1 font-mono text-sm font-semibold text-[#0E1548]">
                    {registrationNo}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          {method === 'cash' ? (
            <div className="rounded-2xl bg-slate-50 px-4 py-3.5 ring-1 ring-slate-200">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Sorumlu
              </p>
              <p className="mt-1 text-sm font-semibold text-[#0E1548]">
                {cashContactName || 'Sorumlu'}
              </p>
              {cashContactNote ? (
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{cashContactNote}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
}
