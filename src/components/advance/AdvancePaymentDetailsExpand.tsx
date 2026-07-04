'use client';

import { useState } from 'react';
import { FiChevronDown, FiChevronUp, FiCreditCard } from 'react-icons/fi';
import {
  formatPaymentDetailLines,
  type AdvancePaymentDetails,
} from '@/lib/advance-payment-details';

type Props = {
  details: AdvancePaymentDetails;
};

export function AdvancePaymentDetailsExpand({ details }: Props) {
  const [open, setOpen] = useState(false);
  const lines = formatPaymentDetailLines(details);

  if (lines.length === 0) return null;

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-emerald-200/80 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left"
        aria-expanded={open}
      >
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 dark:text-emerald-200">
          <FiCreditCard className="h-4 w-4 shrink-0" />
          Ödeme bilgilerini detaylandır
        </span>
        {open ? (
          <FiChevronUp className="h-4 w-4 text-emerald-600" />
        ) : (
          <FiChevronDown className="h-4 w-4 text-emerald-600" />
        )}
      </button>

      {open && (
        <dl className="border-t border-emerald-200/60 px-3.5 py-3 dark:border-emerald-900/40">
          {lines.map(({ label, value }) => (
            <div
              key={label}
              className="flex items-start justify-between gap-3 border-b border-emerald-100/80 py-2 last:border-b-0 dark:border-emerald-900/30"
            >
              <dt className="text-xs text-emerald-800/70 dark:text-emerald-300/70">{label}</dt>
              <dd className="text-right text-xs font-semibold text-emerald-950 dark:text-emerald-100">{value}</dd>
            </div>
          ))}
          {details.senderBank && (
            <p className="mt-2 text-[11px] leading-relaxed text-emerald-800/60 dark:text-emerald-400/80">
              Ödemeniz {details.senderBank} üzerinden gönderilmiştir. Hesabınıza geçiş süresi bankanıza göre değişebilir.
            </p>
          )}
        </dl>
      )}
    </div>
  );
}
