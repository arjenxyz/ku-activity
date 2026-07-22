'use client';

import dayjs from 'dayjs';
import { useRef } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { FiCalendar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import {
  CALENDAR_APPROVAL_RING,
  CALENDAR_MARKER_DOT,
  type CalendarEventMarker,
} from '@/lib/calendar-event-colors';
import type { UnifiedCalendarDay } from '@/lib/personnel-stats';
import { formatString } from '@/lib/strings/format';
import type { WorkLogApprovalStatus } from '@/lib/work-log';

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
    <div className="w-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="border-b border-gray-100 bg-gradient-to-r from-blue-50/80 to-indigo-50/50 px-3 py-3 dark:border-slate-700 dark:from-slate-800 dark:to-slate-800/80 sm:px-5 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="touch-target inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-900 dark:text-gray-200 dark:hover:bg-slate-800"
            aria-label={strings.prevMonth}
          >
            <FiChevronLeft className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1 text-center">
            <div className="inline-flex items-center justify-center gap-2">
              <FiCalendar className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
              <button
                type="button"
                onClick={openMonthPicker}
                className="min-h-[36px] rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-bold capitalize text-gray-900 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
              >
                {monthLabel}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => shiftMonth(1)}
            disabled={isCurrentMonth}
            className="touch-target inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-35 dark:border-slate-600 dark:bg-slate-900 dark:text-gray-200 dark:hover:bg-slate-800"
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

      <div className="p-3 sm:p-5">
        <div className="mb-1.5 grid grid-cols-7 gap-1.5">
          {strings.weekdays.map((d) => (
            <div
              key={d}
              className="py-0.5 text-center text-[11px] font-semibold text-gray-400 dark:text-slate-500"
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
            const status = cell.approvalStatus;
            const approvalBorder =
              cell.workAmount > 0 && status
                ? CALENDAR_APPROVAL_RING[status as WorkLogApprovalStatus]
                : 'border-transparent';
            const todayRing = cell.isToday
              ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-blue-400 dark:ring-offset-slate-800'
              : '';
            const clickable = cell.hasAnyRecord && Boolean(onDaySelect);
            const cellClassName = `aspect-square min-h-[44px] rounded-xl border-2 flex flex-col items-center justify-between py-1 px-0.5 text-center transition-colors ${
              cell.hasAnyRecord
                ? 'bg-slate-50 text-slate-800 dark:bg-slate-900/60 dark:text-slate-200'
                : 'bg-gray-50/80 text-gray-400 dark:bg-slate-900/30 dark:text-slate-500'
            } ${approvalBorder} ${todayRing} ${
              clickable
                ? 'cursor-pointer hover:brightness-[0.97] active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'
                : ''
            }`;
            const cellTitle = formatString(strings.cellTitle, {
              date: cell.date,
              detail: detail || '—',
            });

            const inner = (
              <>
                <span
                  className={`text-xs font-bold ${cell.isToday ? 'text-blue-700 dark:text-blue-300' : ''}`}
                >
                  {cell.day}
                </span>
                {detail ? (
                  <span className="text-[9px] font-semibold leading-tight tabular-nums">{detail}</span>
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

        <div className="mt-4 space-y-2 border-t border-gray-100 pt-3 dark:border-slate-700">
          {onDaySelect ? (
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{strings.tapForDetail}</p>
          ) : null}
          <div className="flex flex-wrap gap-x-3 gap-y-2">
            {MARKER_ORDER.map((key) => (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 text-[11px] text-gray-600 dark:text-gray-400"
              >
                <span className={`h-2 w-2 rounded-full ${CALENDAR_MARKER_DOT[key]}`} />
                {strings.legend[key]}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
