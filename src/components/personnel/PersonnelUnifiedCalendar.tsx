'use client';

import dayjs from 'dayjs';
import { useRef } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { FiCalendar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import {
  CALENDAR_MARKER_DOT,
  CALENDAR_PRESENCE_CELL,
  CALENDAR_PRESENCE_DOT,
  type CalendarEventMarker,
} from '@/lib/calendar-event-colors';
import type { UnifiedCalendarDay, UnifiedCalendarPresence } from '@/lib/personnel-stats';
import { formatString } from '@/lib/strings/format';

const MARKER_ORDER: CalendarEventMarker[] = [
  'work',
  'mesai',
  'advance',
  'deduction',
  'minimum',
];

const PRESENCE_ORDER: Exclude<UnifiedCalendarPresence, null>[] = ['worked', 'absent', 'leave'];

function presenceCellClass(presence: UnifiedCalendarPresence, hasAnyRecord: boolean): string {
  if (presence && presence in CALENDAR_PRESENCE_CELL) {
    return CALENDAR_PRESENCE_CELL[presence];
  }
  return hasAnyRecord
    ? 'border-[#0E1548] bg-[#0E1548]/[0.04] dark:border-blue-300 dark:bg-[#0E1548]/35'
    : 'border-slate-200 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-800/40';
}

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
    <div className="w-full overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md shadow-slate-900/[0.06] dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/25">
      <div className="border-b border-slate-200/90 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-900 sm:px-5 sm:py-3.5">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="touch-target inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            aria-label={strings.prevMonth}
          >
            <FiChevronLeft className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1 text-center">
            <div className="inline-flex items-center justify-center gap-2">
              <FiCalendar className="h-4 w-4 shrink-0 text-[#0E1548] dark:text-slate-300" />
              <button
                type="button"
                onClick={openMonthPicker}
                className="min-h-[36px] rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold capitalize text-[#0E1548] transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0E1548]/40 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
              >
                {monthLabel}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => shiftMonth(1)}
            disabled={isCurrentMonth}
            className="touch-target inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-35 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
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

      <div className="bg-white p-3 dark:bg-slate-900 sm:p-5">
        <div className="mb-1.5 grid grid-cols-7 gap-1.5">
          {strings.weekdays.map((d) => (
            <div
              key={d}
              className="py-0.5 text-center text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400"
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
            const clickable = cell.hasAnyRecord && Boolean(onDaySelect);
            const markerKeys = MARKER_ORDER.filter((m) => {
              if (!cell.markers.includes(m)) return false;
              if (m === 'work' && cell.presence === 'worked') return false;
              return true;
            });
            const sparse = !detail && markerKeys.length === 0;
            const cellClassName = `aspect-square min-h-[44px] rounded-xl border-2 flex flex-col items-center px-0.5 text-center transition-colors ${
              sparse ? 'justify-center py-1' : 'justify-start gap-0.5 py-1'
            } ${presenceCellClass(cell.presence, cell.hasAnyRecord)} ${
              clickable
                ? 'cursor-pointer hover:brightness-[0.97] active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0E1548] dark:hover:brightness-110'
                : ''
            }`;
            const cellTitle = formatString(strings.cellTitle, {
              date: cell.date,
              detail: detail || '—',
            });

            const inner = (
              <>
                <span className="!text-xs font-bold leading-none tabular-nums !text-slate-900 dark:!text-white">
                  {cell.day}
                </span>
                {detail ? (
                  <span className="text-[9px] font-semibold leading-tight tabular-nums text-slate-700 dark:text-slate-200">
                    {detail}
                  </span>
                ) : null}
                {markerKeys.length > 0 ? (
                  <div className="mt-auto flex h-2 items-center justify-center gap-1">
                    {markerKeys.map((m) => (
                      <span
                        key={m}
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${CALENDAR_MARKER_DOT[m]}`}
                        aria-hidden
                      />
                    ))}
                  </div>
                ) : null}
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

        <div className="mt-3 space-y-2.5 border-t border-slate-200 pt-3 dark:border-slate-700">
          {onDaySelect ? (
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
              {strings.tapForDetail}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-x-3 gap-y-2">
            {PRESENCE_ORDER.map((key) => (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                <span className={`h-2.5 w-2.5 shrink-0 rounded-[3px] ${CALENDAR_PRESENCE_DOT[key]}`} />
                {strings.presence[key]}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-2">
            {MARKER_ORDER.map((key) => (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${CALENDAR_MARKER_DOT[key]}`} />
                {strings.legend[key]}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
