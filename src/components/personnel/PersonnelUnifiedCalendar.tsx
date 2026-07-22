'use client';

import dayjs from 'dayjs';
import { useRef } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { FiCalendar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import {
  CALENDAR_MARKER_DOT,
  type CalendarEventMarker,
} from '@/lib/calendar-event-colors';
import type { UnifiedCalendarDay } from '@/lib/personnel-stats';
import { formatString } from '@/lib/strings/format';

const MARKER_ORDER: CalendarEventMarker[] = [
  'work',
  'mesai',
  'advance',
  'deduction',
  'minimum',
];

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

function cellDetail(cell: UnifiedCalendarDay): string {
  if (cell.workAmount > 0) {
    return cell.workAmount % 1 === 0
      ? `${cell.workAmount}g`
      : `${cell.workAmount.toFixed(2)}g`;
  }
  if (cell.mesaiPay > 0) return `+${formatCompactMoney(cell.mesaiPay)}₺`;
  if (cell.advanceTotal > 0) return `-${formatCompactMoney(cell.advanceTotal)}₺`;
  if (cell.deductionTotal > 0) return `-${formatCompactMoney(cell.deductionTotal)}₺`;
  if (cell.minimumTotal > 0) return `+${formatCompactMoney(cell.minimumTotal)}₺`;
  return '';
}

type Props = {
  month: string;
  onMonthChange: (month: string) => void;
  days: UnifiedCalendarDay[];
  onDaySelect?: (date: string) => void;
};

export function PersonnelUnifiedCalendar({
  month,
  onMonthChange,
  days,
  onDaySelect,
}: Props) {
  const strings = useRegistryStrings('components/personnel/PersonnelUnifiedCalendar');
  const monthInputRef = useRef<HTMLInputElement>(null);
  const maxMonth = dayjs().format('YYYY-MM');
  const isCurrentMonth = month === maxMonth;
  const monthLabel = formatMonthLabel(month);

  const shiftMonth = (delta: number) => {
    const next = dayjs(`${month}-01`).add(delta, 'month').format('YYYY-MM');
    if (next > maxMonth) return;
    onMonthChange(next);
  };

  const openMonthPicker = () => {
    const input = monthInputRef.current;
    if (!input) return;
    const picker = (input as HTMLInputElement & { showPicker?: () => void }).showPicker;
    if (typeof picker === 'function') {
      picker.call(input);
      return;
    }
    (input as HTMLInputElement).focus();
    (input as HTMLInputElement).click();
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-white shadow-xl shadow-[#0E1548]/15 ring-1 ring-[#0E1548]/15 dark:bg-slate-900 dark:shadow-black/30 dark:ring-white/10">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035] dark:opacity-[0.06]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230E1548' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />

      <div className="relative overflow-hidden bg-gradient-to-br from-[#0E1548] via-[#152060] to-indigo-950 px-3 py-3.5 text-white sm:px-5 sm:py-4">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle at 90% 10%, rgba(96,165,250,0.45) 0%, transparent 42%), radial-gradient(circle at 10% 90%, rgba(129,140,248,0.3) 0%, transparent 40%)',
          }}
          aria-hidden
        />
        <div className="relative flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="touch-target inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20"
            aria-label={strings.prevMonth}
          >
            <FiChevronLeft className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1 text-center">
            <div className="inline-flex items-center justify-center gap-2">
              <FiCalendar className="h-4 w-4 shrink-0 text-blue-200" />
              <button
                type="button"
                onClick={openMonthPicker}
                className="min-h-[36px] rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-bold capitalize text-white backdrop-blur-sm transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                {monthLabel}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => shiftMonth(1)}
            disabled={isCurrentMonth}
            className="touch-target inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20 disabled:pointer-events-none disabled:opacity-35"
            aria-label={strings.nextMonth}
          >
            <FiChevronRight className="h-5 w-5" />
          </button>
        </div>
        <input
          ref={monthInputRef}
          type="month"
          value={month}
          max={maxMonth}
          onChange={(e) => onMonthChange(e.target.value)}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
        />
      </div>

      <div className="relative bg-gradient-to-b from-blue-50/90 via-white to-indigo-50/40 p-3 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/40 sm:p-5">
        <div className="mb-1.5 grid grid-cols-7 gap-1.5">
          {strings.weekdays.map((d) => (
            <div
              key={d}
              className="py-0.5 text-center text-[11px] font-bold uppercase tracking-wide text-blue-700/80 dark:text-blue-300"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((cell, i) => {
            if (!cell.inMonth) {
              return <div key={`e-${i}`} className="aspect-square min-h-[44px]" />;
            }

            const detail = cellDetail(cell);
            const todayRing = cell.isToday
              ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-blue-50 dark:ring-blue-400 dark:ring-offset-slate-900'
              : '';
            const clickable = cell.hasAnyRecord && Boolean(onDaySelect);
            const cellClassName = `aspect-square min-h-[44px] rounded-xl border-2 flex flex-col items-center justify-between py-1 px-0.5 text-center transition-colors ${
              cell.hasAnyRecord
                ? 'border-[#0E1548] bg-gradient-to-br from-blue-100 to-indigo-100 text-[#0E1548] shadow-sm shadow-blue-500/20 dark:border-blue-300 dark:from-[#152060] dark:to-indigo-950 dark:text-blue-50'
                : 'border-blue-200/80 bg-white/80 text-blue-800/55 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-400'
            } ${todayRing} ${
              clickable
                ? 'cursor-pointer hover:from-blue-200 hover:to-indigo-200 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:hover:from-[#1a2870] dark:hover:to-indigo-900'
                : ''
            }`;
            const cellTitle = formatString(strings.cellTitle, {
              date: cell.date,
              detail: detail || '—',
            });

            const inner = (
              <>
                <span
                  className={`text-xs font-bold ${
                    cell.isToday ? 'text-blue-600 dark:text-blue-300' : ''
                  } ${cell.hasAnyRecord ? 'text-[#0E1548] dark:text-white' : ''}`}
                >
                  {cell.day}
                </span>
                {detail ? (
                  <span className="text-[9px] font-semibold leading-tight tabular-nums text-[#152060] dark:text-blue-100">
                    {detail}
                  </span>
                ) : (
                  <span className="h-[11px]" />
                )}
                <div className="flex h-2 items-center justify-center gap-0.5">
                  {MARKER_ORDER.filter((m) => cell.markers.includes(m)).map((m) => (
                    <span
                      key={m}
                      className={`h-1.5 w-1.5 rounded-full ring-1 ring-white/70 ${CALENDAR_MARKER_DOT[m]}`}
                      aria-hidden
                    />
                  ))}
                </div>
              </>
            );

            if (clickable) {
              return (
                <button
                  key={cell.date}
                  type="button"
                  onClick={() => onDaySelect?.(cell.date)}
                  className={cellClassName}
                  title={cellTitle}
                  aria-label={cellTitle}
                >
                  {inner}
                </button>
              );
            }

            return (
              <div key={cell.date} className={cellClassName} title={cellTitle}>
                {inner}
              </div>
            );
          })}
        </div>

        <div className="mt-3 space-y-2.5 border-t border-blue-200/80 pt-3 dark:border-blue-900/50">
          {onDaySelect ? (
            <p className="text-xs font-medium text-blue-800/80 dark:text-blue-200">
              {strings.tapForDetail}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-x-3 gap-y-2">
            {MARKER_ORDER.map((key) => (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0E1548] dark:text-blue-100"
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full ring-1 ring-blue-300/50 ${CALENDAR_MARKER_DOT[key]}`}
                />
                {strings.legend[key]}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
