'use client';

import dayjs from 'dayjs';
import { FiCalendar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import type { CalendarDay } from '@/lib/personnel-stats';
import type { WorkLogApprovalStatus } from '@/lib/work-log';

const WEEKDAYS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];

const STATUS_STYLES: Record<
  WorkLogApprovalStatus | 'empty',
  { cell: string; dot: string; label: string }
> = {
  confirmed: {
    cell: 'bg-emerald-50 dark:bg-emerald-900/35 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-200/80 dark:ring-emerald-800',
    dot: 'bg-emerald-500',
    label: 'Onaylı',
  },
  pending_employee: {
    cell: 'bg-amber-50 dark:bg-amber-900/35 text-amber-900 dark:text-amber-200 ring-1 ring-amber-200/80 dark:ring-amber-800',
    dot: 'bg-amber-500',
    label: 'Sizin onayınız',
  },
  pending_admin: {
    cell: 'bg-sky-50 dark:bg-sky-900/35 text-sky-900 dark:text-sky-200 ring-1 ring-sky-200/80 dark:ring-sky-800',
    dot: 'bg-sky-500',
    label: 'Yönetici onayı',
  },
  disputed: {
    cell: 'bg-red-50 dark:bg-red-900/35 text-red-900 dark:text-red-200 ring-1 ring-red-200/80 dark:ring-red-800',
    dot: 'bg-red-500',
    label: 'İtiraz',
  },
  none: {
    cell: 'bg-violet-50 dark:bg-violet-900/30 text-violet-900 dark:text-violet-200 ring-1 ring-violet-200/80 dark:ring-violet-800',
    dot: 'bg-violet-500',
    label: 'İşlemde',
  },
  empty: {
    cell: 'bg-gray-50 dark:bg-slate-900/50 text-gray-400 dark:text-slate-500',
    dot: 'bg-gray-300 dark:bg-slate-600',
    label: 'Kayıt yok',
  },
};

function formatMonthLabel(month: string) {
  return new Date(`${month}-01T12:00:00`).toLocaleDateString('tr-TR', {
    month: 'long',
    year: 'numeric',
  });
}

function cellStyle(cell: CalendarDay) {
  if (!cell.inMonth || cell.workAmount <= 0) {
    return STATUS_STYLES.empty.cell;
  }
  const status = cell.approvalStatus ?? 'none';
  return STATUS_STYLES[status].cell;
}

type Props = {
  month: string;
  onMonthChange: (month: string) => void;
  days: CalendarDay[];
};

export function PersonnelCalendar({ month, onMonthChange, days }: Props) {
  const maxMonth = dayjs().format('YYYY-MM');
  const isCurrentMonth = month === maxMonth;
  const monthLabel = formatMonthLabel(month);

  const monthDays = days.filter((d) => d.inMonth);
  const recorded = monthDays.filter((d) => d.workAmount > 0).length;
  const confirmed = monthDays.filter((d) => d.approvalStatus === 'confirmed').length;
  const pending = monthDays.filter(
    (d) => d.approvalStatus === 'pending_employee' || d.approvalStatus === 'pending_admin'
  ).length;

  const shiftMonth = (delta: number) => {
    const next = dayjs(`${month}-01`).add(delta, 'month').format('YYYY-MM');
    if (next > maxMonth) return;
    onMonthChange(next);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="px-4 sm:px-5 py-4 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-blue-50/80 to-indigo-50/50 dark:from-slate-800 dark:to-slate-800/80">
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
              <FiCalendar className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <h2 className="font-bold text-gray-900 dark:text-white capitalize">{monthLabel}</h2>
              {isCurrentMonth && (
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                  Bu ay
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {recorded} kayıtlı gün · {confirmed} onaylı · {pending} bekleyen
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
            className="rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 min-h-[36px]"
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
              return <div key={`e-${i}`} className="aspect-square min-h-[40px]" />;
            }

            const hasWork = cell.workAmount > 0;
            const status = hasWork ? (cell.approvalStatus ?? 'none') : 'empty';
            const todayRing = cell.isToday
              ? 'ring-2 ring-blue-500 dark:ring-blue-400 ring-offset-1 dark:ring-offset-slate-800'
              : '';

            return (
              <div
                key={cell.date}
                className={`aspect-square min-h-[40px] rounded-xl flex flex-col items-center justify-center text-center p-0.5 transition-colors ${cellStyle(cell)} ${todayRing}`}
                title={
                  hasWork
                    ? `${cell.date} · ${cell.workAmount} gün · ${STATUS_STYLES[status].label}`
                    : cell.date
                }
              >
                <span
                  className={`text-xs font-bold ${cell.isToday ? 'text-blue-700 dark:text-blue-300' : ''}`}
                >
                  {cell.day}
                </span>
                {hasWork && (
                  <>
                    <span className="text-[10px] font-semibold leading-tight mt-0.5 tabular-nums">
                      {cell.workAmount % 1 === 0
                        ? `${cell.workAmount}g`
                        : `${cell.workAmount.toFixed(2)}g`}
                    </span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-0.5 ${STATUS_STYLES[status].dot}`}
                      aria-hidden
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700 flex flex-wrap gap-x-4 gap-y-2">
          {(
            Object.entries(STATUS_STYLES) as [
              keyof typeof STATUS_STYLES,
              (typeof STATUS_STYLES)['empty'],
            ][]
          )
            .filter(([key]) => key !== 'none')
            .map(([key, style]) => (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 text-[11px] text-gray-600 dark:text-gray-400"
              >
                <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                {style.label}
              </span>
            ))}
        </div>
      </div>
    </div>
  );
}
