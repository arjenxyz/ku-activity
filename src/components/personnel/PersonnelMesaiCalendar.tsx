'use client';

import dayjs from 'dayjs';
import { FiClock, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import type { MesaiCalendarDay } from '@/lib/personnel-stats';
import { formatMoney } from '@/lib/format';
import { mesaiLabel } from '@/lib/work-log';
import type { WorkLogApprovalStatus } from '@/lib/work-log';

const WEEKDAYS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];

const STATUS_DOT: Record<WorkLogApprovalStatus, string> = {
  confirmed: 'bg-emerald-500',
  pending_employee: 'bg-amber-500',
  pending_admin: 'bg-sky-500',
  disputed: 'bg-red-500',
  none: 'bg-violet-500',
};

function formatMonthLabel(month: string) {
  return new Date(`${month}-01T12:00:00`).toLocaleDateString('tr-TR', {
    month: 'long',
    year: 'numeric',
  });
}

function formatCompactMoney(amount: number) {
  if (amount >= 1000) {
    return `${Math.round(amount / 100) / 10}k`;
  }
  return `${Math.round(amount)}`;
}

type Props = {
  month: string;
  onMonthChange: (month: string) => void;
  days: MesaiCalendarDay[];
  totalPay: number;
};

export function PersonnelMesaiCalendar({ month, onMonthChange, days, totalPay }: Props) {
  const maxMonth = dayjs().format('YYYY-MM');
  const isCurrentMonth = month === maxMonth;
  const monthLabel = formatMonthLabel(month);

  const monthDays = days.filter((d) => d.inMonth);
  const mesaiDays = monthDays.filter((d) => d.mesaiPay > 0).length;

  const shiftMonth = (delta: number) => {
    const next = dayjs(`${month}-01`).add(delta, 'month').format('YYYY-MM');
    if (next > maxMonth) return;
    onMonthChange(next);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="px-4 sm:px-5 py-4 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-orange-50/80 to-amber-50/50 dark:from-slate-800 dark:to-slate-800/80">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="touch-target inline-flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 shrink-0"
            aria-label="Önceki ay"
          >
            <FiChevronLeft className="w-5 h-5" />
          </button>

          <div className="min-w-0 flex-1 text-center">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <FiClock className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
              <h2 className="font-bold text-gray-900 dark:text-white capitalize">{monthLabel}</h2>
              {isCurrentMonth && (
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300">
                  Bu ay
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {mesaiDays} mesai günü · {formatMoney(totalPay)} toplam kazanç
            </p>
          </div>

          <button
            type="button"
            onClick={() => shiftMonth(1)}
            disabled={isCurrentMonth}
            className="touch-target inline-flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-35 disabled:pointer-events-none shrink-0"
            aria-label="Sonraki ay"
          >
            <FiChevronRight className="w-5 h-5" />
          </button>
        </div>

        <label className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="hidden sm:inline">Ay seç:</span>
          <input
            type="month"
            value={month}
            max={maxMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 min-h-[36px]"
          />
        </label>
      </div>

      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-7 gap-1.5 mb-2">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="text-center text-[11px] font-semibold text-gray-400 dark:text-slate-500 py-1"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((cell, i) => {
            if (!cell.inMonth) {
              return <div key={`e-${i}`} className="aspect-square min-h-[44px]" />;
            }

            const hasMesai = cell.mesaiPay > 0;
            const status = hasMesai ? (cell.approvalStatus ?? 'none') : null;
            const todayRing = cell.isToday
              ? 'ring-2 ring-orange-500 dark:ring-orange-400 ring-offset-1 dark:ring-offset-slate-800'
              : '';

            return (
              <div
                key={cell.date}
                className={`aspect-square min-h-[44px] rounded-xl flex flex-col items-center justify-center text-center p-0.5 transition-colors ${todayRing} ${
                  hasMesai
                    ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-900 dark:text-orange-200 ring-1 ring-orange-200/80 dark:ring-orange-800'
                    : 'bg-gray-50 dark:bg-slate-900/50 text-gray-400 dark:text-slate-500'
                }`}
                title={
                  hasMesai
                    ? `${cell.date} · ${mesaiLabel(cell.mesaiType)} · ${formatMoney(cell.mesaiPay)}`
                    : cell.date
                }
              >
                <span
                  className={`text-xs font-bold ${cell.isToday ? 'text-orange-700 dark:text-orange-300' : ''}`}
                >
                  {cell.day}
                </span>
                {hasMesai && (
                  <>
                    <span className="text-[9px] sm:text-[10px] font-semibold leading-tight mt-0.5 tabular-nums">
                      {formatCompactMoney(cell.mesaiPay)}₺
                    </span>
                    {status && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full mt-0.5 ${STATUS_DOT[status]}`}
                        aria-hidden
                      />
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
