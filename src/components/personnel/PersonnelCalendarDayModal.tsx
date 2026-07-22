'use client';

import { useEffect } from 'react';
import { FiCalendar, FiX } from 'react-icons/fi';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { formatDate, formatMoney } from '@/lib/format';
import {
  mesaiPayForLog,
  workDayLabel,
  workDayUnitsForLog,
  type Deduction,
  type MinimumWage,
  type WorkLog,
} from '@/lib/personnel-stats';
import { getWorkLogApprovalStatus, mesaiLabel, type WorkLogApprovalStatus } from '@/lib/work-log';
import { PersonnelBadge } from '@/components/personnel/PersonnelRecordCard';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

type Props = {
  open: boolean;
  date: string | null;
  workLog: WorkLog | null;
  advances: Deduction[];
  otherDeductions: Deduction[];
  minimumWages: MinimumWage[];
  dailyWage: number;
  onClose: () => void;
};

function statusLabel(
  status: WorkLogApprovalStatus,
  strings: ReturnType<typeof useRegistryStrings<'components/personnel/PersonnelCalendarDayModal'>>
) {
  if (status === 'none') return strings.status.none;
  return strings.status[status as keyof typeof strings.status] ?? strings.status.none;
}

function statusTone(status: WorkLogApprovalStatus): 'success' | 'warning' | 'default' {
  if (status === 'confirmed') return 'success';
  if (status === 'disputed') return 'warning';
  return 'default';
}

function FinanceList({
  title,
  items,
  amountClassName,
}: {
  title: string;
  items: Deduction[] | MinimumWage[];
  amountClassName?: string;
}) {
  if (items.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
      <p className="border-b border-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:border-slate-800">
        {title}
      </p>
      <ul>
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 last:border-0 dark:border-slate-800"
          >
            <p className="min-w-0 truncate text-sm text-slate-700 dark:text-slate-300">
              {item.description || title}
            </p>
            <p
              className={`shrink-0 text-sm font-semibold tabular-nums ${amountClassName ?? 'text-slate-900 dark:text-white'}`}
            >
              {formatMoney(item.amount)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PersonnelCalendarDayModal({
  open,
  date,
  workLog,
  advances,
  otherDeductions,
  minimumWages,
  dailyWage,
  onClose,
}: Props) {
  const strings = useRegistryStrings('components/personnel/PersonnelCalendarDayModal');
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !date) return null;

  const status = workLog ? getWorkLogApprovalStatus(workLog) : null;
  const hasMesai = workLog ? Number(workLog.mesai_units ?? 0) > 0 : false;
  const mesaiPay = workLog ? mesaiPayForLog(workLog, dailyWage) : 0;
  const basePay = workLog ? workDayUnitsForLog(workLog) * dailyWage : 0;
  const isQr = workLog?.description?.toLowerCase().includes('qr') ?? false;
  const hasContent =
    Boolean(workLog) ||
    advances.length > 0 ||
    otherDeductions.length > 0 ||
    minimumWages.length > 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label={strings.close}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-day-modal-title"
        className="safe-pb relative max-h-[min(88dvh,640px)] w-full overflow-y-auto overscroll-none rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 sm:max-w-md sm:rounded-2xl"
        data-allow-scroll
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-100 bg-white/95 px-5 pb-3 pt-5 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/40">
              <FiCalendar className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {strings.modalTitle}
              </p>
              <h2 id="calendar-day-modal-title" className="font-semibold text-slate-900 dark:text-white">
                {formatDate(date)}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label={strings.close}
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {!hasContent ? (
            <div className="py-8 text-center">
              <p className="font-medium text-slate-900 dark:text-white">{strings.noRecordTitle}</p>
              <p className="mt-1 text-sm text-slate-500">{strings.noRecordHint}</p>
            </div>
          ) : null}

          {workLog && status ? (
            <section className="space-y-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {strings.workSection}
                </p>
                <PersonnelBadge variant={statusTone(status)}>{statusLabel(status, strings)}</PersonnelBadge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-500">{strings.amountLabel}</p>
                  <p className="mt-0.5 font-semibold text-slate-900 dark:text-white">
                    {workDayLabel(Number(workLog.amount), workLog.mesai_type)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">{strings.workPayLabel}</p>
                  <p className="mt-0.5 font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
                    {formatMoney(basePay)}
                  </p>
                </div>
                {status === 'confirmed' && isQr ? (
                  <div className="col-span-2 flex justify-end">
                    <PersonnelBadge variant="success">{strings.qrAttendance}</PersonnelBadge>
                  </div>
                ) : null}
              </div>
              {workLog.description ? (
                <div>
                  <p className="text-xs text-slate-500">{strings.descriptionLabel}</p>
                  <p className="mt-0.5 text-sm text-slate-700 dark:text-slate-300">{workLog.description}</p>
                </div>
              ) : null}
              {workLog.employee_dispute_note ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 dark:border-red-900/50 dark:bg-red-950/30">
                  <p className="text-xs font-semibold text-red-700 dark:text-red-300">{strings.disputeLabel}</p>
                  <p className="mt-1 text-sm text-red-800 dark:text-red-200">{workLog.employee_dispute_note}</p>
                </div>
              ) : null}
            </section>
          ) : null}

          {workLog && hasMesai && status ? (
            <section className="space-y-3 rounded-2xl border border-orange-200 bg-orange-50/50 p-4 dark:border-orange-900/40 dark:bg-orange-950/20">
              <p className="text-xs font-semibold uppercase tracking-wider text-orange-700/80 dark:text-orange-300/80">
                {strings.mesaiSection}
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-500">{strings.mesaiTypeLabel}</p>
                  <p className="mt-0.5 font-semibold text-slate-900 dark:text-white">
                    {mesaiLabel(workLog.mesai_type)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">{strings.mesaiPayLabel}</p>
                  <p className="mt-0.5 font-semibold tabular-nums text-orange-700 dark:text-orange-300">
                    {formatMoney(mesaiPay)}
                  </p>
                </div>
              </div>
            </section>
          ) : null}

          <FinanceList
            title={strings.advanceSection}
            items={advances}
            amountClassName="text-amber-700 dark:text-amber-300"
          />
          <FinanceList
            title={strings.deductionSection}
            items={otherDeductions}
            amountClassName="text-rose-700 dark:text-rose-300"
          />
          <FinanceList
            title={strings.minimumSection}
            items={minimumWages}
            amountClassName="text-violet-700 dark:text-violet-300"
          />
        </div>
      </div>
    </div>
  );
}
