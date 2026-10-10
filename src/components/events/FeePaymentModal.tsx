'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  FiArrowLeft,
  FiCheck,
  FiCopy,
  FiCreditCard,
  FiDollarSign,
  FiUpload,
  FiX,
} from 'react-icons/fi';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import {
  isAllowedReceiptFile,
  RECEIPT_FILE_ACCEPT,
  RECEIPT_FILE_TYPE_ERROR,
} from '@/lib/payments/receipt-file';

type Method = 'transfer' | 'cash';
type CopyKey = 'iban' | 'name' | 'note';

type Props = {
  open: boolean;
  onClose: () => void;
  /** Called when cash QR is accepted (payment cleared). */
  onPaid?: () => void;
  eventId?: string;
  passengerName?: string | null;
  feeLabel?: string | null;
  paymentIban?: string | null;
  cashPaymentEnabled?: boolean;
  cashContactName?: string | null;
  cashContactNote?: string | null;
  registrationNo?: string;
};

export function FeePaymentModal({
  open,
  onClose,
  onPaid,
  eventId,
  passengerName = null,
  feeLabel = null,
  paymentIban = null,
  cashPaymentEnabled = false,
  cashContactName = null,
  cashContactNote = null,
  registrationNo,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [method, setMethod] = useState<Method | null>(null);
  const [copied, setCopied] = useState<CopyKey | null>(null);
  const [cashToken, setCashToken] = useState<string | null>(null);
  const [cashBusy, setCashBusy] = useState(false);
  const [cashError, setCashError] = useState<string | null>(null);
  const [cashPaid, setCashPaid] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptBusy, setReceiptBusy] = useState(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [receiptMessage, setReceiptMessage] = useState<string | null>(null);

  useBodyScrollLock(open);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) {
      setMethod(null);
      setCopied(null);
      setCashToken(null);
      setCashError(null);
      setCashBusy(false);
      setCashPaid(false);
      setReceiptOpen(false);
      setReceiptBusy(false);
      setReceiptError(null);
      setReceiptMessage(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (receiptOpen) {
          setReceiptOpen(false);
          return;
        }
        if (method) setMethod(null);
        else onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, method, onClose, receiptOpen]);

  const createCashQr = useCallback(async () => {
    if (!eventId || !registrationNo) {
      setCashError('Kayıt bilgisi eksik');
      return;
    }
    setCashBusy(true);
    setCashError(null);
    try {
      const response = await fetch('/api/payments/cash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          eventId,
          registrationNo,
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        handoff?: { token: string };
      } | null;
      if (!response.ok) throw new Error(payload?.error ?? 'QR oluşturulamadı');
      setCashToken(payload?.handoff?.token ?? null);
    } catch (err) {
      setCashError(err instanceof Error ? err.message : 'QR oluşturulamadı');
    } finally {
      setCashBusy(false);
    }
  }, [eventId, registrationNo]);

  useEffect(() => {
    if (method !== 'cash' || cashToken || cashBusy || cashPaid) return;
    void createCashQr();
  }, [method, cashToken, cashBusy, cashPaid, createCashQr]);

  useEffect(() => {
    if (method !== 'cash' || !cashToken || cashPaid) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const response = await fetch(
          `/api/payments/cash?token=${encodeURIComponent(cashToken)}`
        );
        const payload = (await response.json().catch(() => null)) as {
          handoff?: { consumedAt?: string | null };
        } | null;
        if (cancelled) return;
        if (payload?.handoff?.consumedAt) {
          setCashPaid(true);
          onPaid?.();
        }
      } catch {
        /* ignore poll errors */
      }
    };
    void poll();
    const timer = window.setInterval(() => void poll(), 2500);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [method, cashToken, cashPaid, onPaid]);

  async function copyText(key: CopyKey, value: string, stripSpaces = false) {
    const text = stripSpaces ? value.replace(/\s+/g, '') : value;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.setTimeout(() => setCopied((current) => (current === key ? null : current)), 2000);
    } catch {
      /* ignore */
    }
  }

  async function uploadReceipt(file: File) {
    if (!eventId || !registrationNo) {
      setReceiptError('Kayıt bilgisi eksik');
      return;
    }
    if (!isAllowedReceiptFile(file)) {
      setReceiptError(RECEIPT_FILE_TYPE_ERROR);
      return;
    }
    setReceiptBusy(true);
    setReceiptError(null);
    setReceiptMessage(null);
    try {
      const form = new FormData();
      form.set('eventId', eventId);
      form.set('registrationNo', registrationNo);
      form.set('receipt', file);
      const response = await fetch('/api/payments/claims', { method: 'POST', body: form });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        claim?: { codeMatched?: boolean; amountMatched?: boolean };
      } | null;
      if (!response.ok) throw new Error(payload?.error ?? 'Yükleme başarısız');
      setReceiptMessage('Dekont inceleme kuyruğuna alındı');
    } catch (err) {
      setReceiptError(err instanceof Error ? err.message : 'Yükleme başarısız');
    } finally {
      setReceiptBusy(false);
    }
  }

  if (!mounted || !open) return null;

  const hasTransfer = Boolean(paymentIban);
  const hasCash = Boolean(cashPaymentEnabled);
  const hasAny = hasTransfer || hasCash;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]" aria-hidden />
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
              <CopyCard
                label="IBAN"
                value={paymentIban}
                mono
                copied={copied === 'iban'}
                onCopy={() => void copyText('iban', paymentIban, true)}
              />
              {passengerName ? (
                <CopyCard
                  label="Ad soyad"
                  value={passengerName}
                  copied={copied === 'name'}
                  onCopy={() => void copyText('name', passengerName)}
                />
              ) : null}
              {feeLabel ? (
                <div className="rounded-2xl bg-slate-50 px-4 py-3.5 ring-1 ring-slate-200">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Ücret
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#E8770A]">{feeLabel}</p>
                </div>
              ) : null}
              {registrationNo ? (
                <CopyCard
                  label="Açıklama"
                  value={registrationNo}
                  mono
                  copied={copied === 'note'}
                  onCopy={() => void copyText('note', registrationNo)}
                />
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setReceiptError(null);
                  setReceiptOpen(true);
                }}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                <FiCheck className="h-4 w-4" aria-hidden />
                Ödemeyi yaptım
              </button>
            </div>
          ) : null}

          {method === 'cash' ? (
            <div className="space-y-3">
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
                {feeLabel ? (
                  <p className="mt-2 text-sm font-semibold text-[#E8770A]">{feeLabel}</p>
                ) : null}
              </div>

              {cashPaid ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-5 text-center">
                  <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <FiCheck className="h-5 w-5" aria-hidden />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-emerald-800">Teslim onaylandı</p>
                  <p className="mt-1 text-sm text-emerald-700/90">Geçiş kartın açıldı.</p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white"
                  >
                    Tamam
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center">
                  <p className="text-sm font-semibold text-[#0E1548]">Teslim QR</p>
                  {cashBusy && !cashToken ? (
                    <p className="mt-6 text-sm text-slate-500">QR hazırlanıyor…</p>
                  ) : null}
                  {cashToken ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/qr?token=${encodeURIComponent(cashToken)}`}
                        alt="Elden teslim QR"
                        className="mx-auto mt-4 h-44 w-44 rounded-2xl bg-white p-2 shadow-sm ring-1 ring-slate-200"
                      />
                    </>
                  ) : null}
                  {cashError ? (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm text-red-600">{cashError}</p>
                      <button
                        type="button"
                        onClick={() => void createCashQr()}
                        className="text-sm font-medium text-[#2D6AF6]"
                      >
                        Tekrar dene
                      </button>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {receiptOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" aria-hidden />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="receipt-upload-title"
            className="relative z-[1] w-full max-w-sm overflow-hidden rounded-3xl bg-[#f4f7fb] shadow-2xl ring-1 ring-slate-200/80"
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 bg-white/70 px-4 py-2.5">
              <p
                id="receipt-upload-title"
                className="truncate text-sm font-semibold text-[#0E1548]"
              >
                Dekont yükle
              </p>
              <button
                type="button"
                onClick={() => setReceiptOpen(false)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200/80 text-slate-600 hover:bg-slate-200"
                aria-label="Kapat"
              >
                <FiX className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div className="space-y-3 px-5 py-5">
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-center text-xs font-semibold text-amber-800 ring-1 ring-amber-200/80">
                Dekont yüklemek zorunlu
              </p>
              <p className="text-center text-xs text-slate-500">PDF veya görsel</p>
              {receiptMessage ? (
                <p className="text-center text-sm font-medium text-emerald-700">{receiptMessage}</p>
              ) : null}
              {receiptError ? (
                <p className="text-center text-sm text-red-600">{receiptError}</p>
              ) : null}
              <label
                className={`flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#0E1548] text-sm font-semibold text-white hover:bg-[#152060] ${
                  receiptBusy ? 'pointer-events-none opacity-60' : ''
                }`}
              >
                <FiUpload className="h-4 w-4" aria-hidden />
                {receiptBusy ? 'Yükleniyor…' : receiptMessage ? 'Yeni dekont yükle' : 'Dosya seç'}
                <input
                  type="file"
                  accept={RECEIPT_FILE_ACCEPT}
                  className="sr-only"
                  disabled={receiptBusy}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadReceipt(file);
                    event.target.value = '';
                  }}
                />
              </label>
              {receiptMessage ? (
                <button
                  type="button"
                  onClick={() => {
                    setReceiptOpen(false);
                    onClose();
                  }}
                  className="flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 text-sm font-semibold text-[#0E1548] hover:bg-slate-50"
                >
                  Tamam
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>,
    document.body
  );
}

function CopyCard({
  label,
  value,
  mono = false,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  mono?: boolean;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3.5 ring-1 ring-slate-200">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p
        className={`mt-1 break-all text-sm font-semibold text-[#0E1548] ${mono ? 'font-mono' : ''}`}
      >
        {value}
      </p>
      <button
        type="button"
        onClick={onCopy}
        className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-[#2D6AF6]"
      >
        <FiCopy className="h-3.5 w-3.5" aria-hidden />
        {copied ? 'Kopyalandı' : 'Kopyala'}
      </button>
    </div>
  );
}
