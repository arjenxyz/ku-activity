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
    <div className="w-full overflow-hidden rounded-2xl border-2 border-[#0E1548]/25 bg-gradient-to-b from-[#EEF2FF] via-white to-white shadow-md shadow-[#0E1548]/[0.06] dark:border-[#7B9CFF]/35 dark:from-slate-900 dark:via-slate-800 dark:to-slate-800 dark:shadow-black/20">
      <div className="border-b-2 border-[#0E1548]/20 bg-gradient-to-r from-[#0E1548]/[0.08] via-[#3B7FED]/10 to-[#5B9FFF]/10 px-3 py-3 dark:border-[#7B9CFF]/25 dark:from-[#0E1548]/60 dark:via-slate-800 dark:to-slate-800/80 sm:px-5 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="touch-target inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#0E1548]/25 bg-white text-[#0E1548] hover:bg-[#E8EBF8] dark:border-[#7B9CFF]/40 dark:bg-slate-900 dark:text-[#B8C7FF] dark:hover:bg-slate-800"
            aria-label={strings.prevMonth}
          >
            <FiChevronLeft className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1 text-center">
            <div className="inline-flex items-center justify-center gap-2">
              <FiCalendar className="h-4 w-4 shrink-0 text-[#0E1548] dark:text-[#9EB6FF]" />
              <button
                type="button"
                onClick={openMonthPicker}
                className="min-h-[36px] rounded-lg border-2 border-[#0E1548]/25 bg-white px-3 py-1.5 text-sm font-bold capitalize text-[#0E1548] transition hover:bg-[#E8EBF8] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0E1548] dark:border-[#7B9CFF]/40 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
              >
                {monthLabel}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => shiftMonth(1)}
            disabled={isCurrentMonth}
            className="touch-target inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#0E1548]/25 bg-white text-[#0E1548] hover:bg-[#E8EBF8] disabled:pointer-events-none disabled:opacity-35 dark:border-[#7B9CFF]/40 dark:bg-slate-900 dark:text-[#B8C7FF] dark:hover:bg-slate-800"
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

      <div className="bg-[#F7F9FF]/80 p-3 dark:bg-transparent sm:p-5">
        <div className="mb-1.5 grid grid-cols-7 gap-1.5">
          {strings.weekdays.map((d) => (
            <div
              key={d}
              className="py-0.5 text-center text-[11px] font-bold text-[#0E1548]/70 dark:text-[#9EB6FF]"
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
              ? 'ring-2 ring-[#3B7FED] ring-offset-2 ring-offset-[#F7F9FF] dark:ring-[#7B9CFF] dark:ring-offset-slate-800'
              : '';
            const clickable = cell.hasAnyRecord && Boolean(onDaySelect);
            const cellClassName = `aspect-square min-h-[44px] rounded-xl border-2 flex flex-col items-center justify-between py-1 px-0.5 text-center transition-colors ${
              cell.hasAnyRecord
                ? 'border-[#0E1548] bg-white text-[#0E1548] shadow-sm shadow-[#0E1548]/10 dark:border-[#7B9CFF] dark:bg-[#0E1548]/45 dark:text-[#E8EEFF]'
                : 'border-[#0E1548]/15 bg-white/70 text-[#0E1548]/55 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-400'
            } ${todayRing} ${
              clickable
                ? 'cursor-pointer hover:bg-[#E8EBF8] active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0E1548] dark:hover:bg-[#0E1548]/55'
                : ''
            }`;
            const cellTitle = formatString(strings.cellTitle, {
              date: cell.date,
              detail: detail || '—',
            });

            const inner = (
              <>
                <span
                  className={`text-xs font-bold ${cell.isToday ? 'text-[#3B7FED] dark:text-[#9EB6FF]' : ''}`}
                >
                  {cell.day}
                </span>
                {detail ? (
                  <span className="text-[9px] font-semibold leading-tight tabular-nums text-[#0E1548]/80 dark:text-[#C5D2FF]">
                    {detail}
                  </span>
                ) : (
                  <span className="h-[11px]" />
                )}
                <div className="flex h-2 items-center justify-center gap-0.5">
                  {MARKER_ORDER.filter((m) => cell.markers.includes(m)).map((m) => (
                    <span
                      key={m}
                      className={`h-1.5 w-1.5 rounded-full ${CALENDAR_MARKER_DOT[m]}`}
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

        <div className="mt-3 space-y-2.5 border-t-2 border-[#0E1548]/20 pt-3 dark:border-[#7B9CFF]/25">
          {onDaySelect ? (
            <p className="text-xs font-medium text-[#0E1548]/75 dark:text-[#B8C7FF]">{strings.tapForDetail}</p>
          ) : null}
          <div className="flex flex-wrap gap-x-3 gap-y-2">
            {MARKER_ORDER.map((key) => (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0E1548] dark:text-[#E8EEFF]"
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full ring-1 ring-[#0E1548]/20 ${CALENDAR_MARKER_DOT[key]}`}
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
