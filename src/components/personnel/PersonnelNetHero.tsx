'use client';

import { FiDollarSign } from 'react-icons/fi';
import { formatMoney } from '@/lib/format';

type Props = {
  net: number;
  gross: number;
  monthLabel: string;
  onOpenFinance?: () => void;
};

export function PersonnelNetHero({ net, gross, monthLabel, onOpenFinance }: Props) {
  return (
    <button
      type="button"
      onClick={onOpenFinance}
      className="relative w-full text-left rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white shadow-lg shadow-blue-600/20 overflow-hidden active:scale-[0.99] transition-transform sm:hidden"
    >
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 85% 15%, white 0%, transparent 45%)',
        }}
      />
      <div className="relative px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-100/90">
              {monthLabel} · Tahmini net
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight">{formatMoney(net)}</p>
            <p className="mt-1 text-xs text-blue-100/80">Brüt {formatMoney(gross)}</p>
          </div>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <FiDollarSign className="w-5 h-5" />
          </span>
        </div>
        {onOpenFinance && (
          <p className="mt-3 text-xs font-medium text-blue-100">Finans detayı →</p>
        )}
      </div>
    </button>
  );
}
