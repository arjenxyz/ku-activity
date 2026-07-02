'use client';

import { FiArrowRight, FiTrendingDown, FiTrendingUp } from 'react-icons/fi';
import { formatMoney } from '@/lib/format';

type Props = {
  net: number;
  gross: number;
  totalAdvance?: number;
  totalDeduct?: number;
  monthLabel: string;
  onOpenFinance?: () => void;
};

export function PersonnelNetHero({
  net,
  gross,
  totalAdvance = 0,
  totalDeduct = 0,
  monthLabel,
  onOpenFinance,
}: Props) {
  const deductions = totalAdvance + totalDeduct;
  const netPct = gross > 0 ? Math.min(100, Math.round((net / gross) * 100)) : 0;

  const Wrapper = onOpenFinance ? 'button' : 'div';
  const wrapperProps = onOpenFinance
    ? {
        type: 'button' as const,
        onClick: onOpenFinance,
        className:
          'relative w-full text-left rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white shadow-xl shadow-blue-950/25 overflow-hidden active:scale-[0.995] transition-transform group',
      }
    : {
        className:
          'relative w-full rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white shadow-xl shadow-blue-950/25 overflow-hidden',
      };

  return (
    <Wrapper {...wrapperProps}>
      <div
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 90% 10%, rgba(96,165,250,0.5) 0%, transparent 42%), radial-gradient(circle at 10% 90%, rgba(129,140,248,0.35) 0%, transparent 40%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-200/90">
              {monthLabel}
            </p>
            <p className="mt-1 text-xs text-slate-400">Tahmini net maaş</p>
            <p className="mt-2 text-3xl sm:text-4xl font-bold tabular-nums tracking-tight">
              {formatMoney(net)}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <div className="inline-flex flex-col items-end gap-1 rounded-2xl bg-white/10 backdrop-blur px-3 py-2">
              <span className="text-[10px] uppercase tracking-wider text-slate-400">Net oran</span>
              <span className="text-lg font-bold tabular-nums">%{netPct}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-blue-400 transition-all"
            style={{ width: `${netPct}%` }}
          />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-xl bg-white/8 px-3 py-2.5 border border-white/10">
            <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-400">
              <FiTrendingUp className="w-3 h-3 text-emerald-400" />
              Brüt
            </p>
            <p className="mt-1 text-sm font-semibold tabular-nums">{formatMoney(gross)}</p>
          </div>
          <div className="rounded-xl bg-white/8 px-3 py-2.5 border border-white/10">
            <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-400">
              <FiTrendingDown className="w-3 h-3 text-amber-400" />
              Kesinti
            </p>
            <p className="mt-1 text-sm font-semibold tabular-nums">{formatMoney(deductions)}</p>
          </div>
          <div className="rounded-xl bg-white/8 px-3 py-2.5 border border-white/10">
            <p className="text-[10px] uppercase tracking-wider text-slate-400">Net</p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-emerald-300">
              {formatMoney(net)}
            </p>
          </div>
        </div>

        {onOpenFinance && (
          <p className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-200 group-hover:text-white transition-colors">
            Bordro ve finans detayı
            <FiArrowRight className="w-3.5 h-3.5" />
          </p>
        )}
      </div>
    </Wrapper>
  );
}
