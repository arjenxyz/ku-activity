'use client';

import { FiArrowRight, FiTrendingDown, FiTrendingUp } from 'react-icons/fi';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { formatMoney } from '@/lib/format';
import { PersonnelMonthChip } from '@/components/personnel/PersonnelMonthChip';

type Props = {
  net: number;
  gross: number;
  totalAdvance?: number;
  totalDeduct?: number;
  month: string;
  onMonthChange: (month: string) => void;
  onOpenFinance?: () => void;
};

export function PersonnelNetHero({
  net,
  gross,
  totalAdvance = 0,
  totalDeduct = 0,
  month,
  onMonthChange,
  onOpenFinance,
}: Props) {
  const strings = useRegistryStrings('components/personnel/PersonnelNetHero');
  const deductions = totalAdvance + totalDeduct;
  const netTone = net < 0 ? 'text-red-300' : 'text-emerald-300';

  return (
    <section
      aria-label={strings.sectionAriaLabel}
      className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#0E1548] via-[#152060] to-indigo-950 text-white shadow-xl shadow-[#0E1548]/25 ring-1 ring-white/10"
    >
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 90% 10%, rgba(96,165,250,0.45) 0%, transparent 42%), radial-gradient(circle at 10% 90%, rgba(129,140,248,0.3) 0%, transparent 40%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-400">{strings.estimatedNet}</p>
            <p className={`mt-2 text-3xl sm:text-4xl font-bold tabular-nums tracking-tight ${netTone}`}>
              {formatMoney(net)}
            </p>
          </div>
          <PersonnelMonthChip month={month} onChange={onMonthChange} tone="onDark" />
        </div>

        <div
          className="my-4 sm:my-5 h-px bg-gradient-to-r from-emerald-400/70 via-blue-400/50 to-transparent"
          aria-hidden
        />

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-xl border border-white/10 bg-white/8 px-3 py-2.5">
            <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <FiTrendingUp className="h-3 w-3 text-emerald-400" aria-hidden />
              {strings.gross}
            </p>
            <p className="mt-1 text-sm font-semibold tabular-nums">{formatMoney(gross)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/8 px-3 py-2.5">
            <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <FiTrendingDown className="h-3 w-3 text-amber-400" aria-hidden />
              {strings.deduction}
            </p>
            <p className="mt-1 text-sm font-semibold tabular-nums">{formatMoney(deductions)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/8 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {strings.net}
            </p>
            <p className={`mt-1 text-sm font-semibold tabular-nums ${netTone}`}>{formatMoney(net)}</p>
          </div>
        </div>

        {onOpenFinance ? (
          <button
            type="button"
            onClick={onOpenFinance}
            className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-200 transition-colors hover:text-white"
          >
            {strings.financeDetail}
            <FiArrowRight className="h-3.5 w-3.5" aria-hidden />
          </button>
        ) : null}
      </div>
    </section>
  );
}
