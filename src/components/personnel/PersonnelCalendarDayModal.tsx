'use client';

import { useEffect } from 'react';
import { FiCalendar, FiX } from 'react-icons/fi';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { formatDate, formatMoney } from '@/lib/format';
import {
  deductionTypeLabel,
  mesaiPayForLog,
  workDayLabel,
  type Deduction,
  type MinimumWage,
  type WorkLog,
} from '@/lib/personnel-stats';
import { getWorkLogApprovalStatus, mesaiLabel, type WorkLogApprovalStatus } from '@/lib/work-log';
import { PersonnelBadge } from '@/components/personnel/PersonnelRecordCard';

type Props = {
  open: boolean;
  date: string | null;
  mode: 'work' | 'mesai';
  workLog: WorkLog | null;
  deductions: Deduction[];
  minimumWages: MinimumWage[];
  dailyWage: number;
  onClose: () => void;
};

function statusLabel(status: WorkLogApprovalStatus, strings: ReturnType<typeof useRegistryStrings<'components/personnel/PersonnelCalendarDayModal'>>) {
  if (status === 'none') return strings.status.none;
  return strings.status[status as keyof typeof strings.status] ?? strings.status.none;
}

function statusTone(status: WorkLogApprovalStatus): 'success' | 'warning' | 'default' {
  if (status === 'confirmed') return 'success';
  if (status === 'disputed') return 'warning';
  return 'default';
}

export function PersonnelCalendarDayModal({
  open,
  date,
  mode,
  workLog,
  deductions,
  minimumWages,
  dailyWage,
  onClose,
}: Props) {
  const strings = useRegistryStrings('components/personnel/PersonnelCalendarDayModal');

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open || !date) return null;

  const status = workLog ? getWorkLogApprovalStatus(workLog) : null;
  const hasMesai = workLog ? Number(workLog.mesai_units ?? 0) > 0 : false;
  const mesaiPay = workLog ? mesaiPayForLog(workLog, dailyWage) : 0;
  const isQr = workLog?.description?.toLowerCase().includes('qr') ?? false;
  const showWork = mode === 'work' && workLog;
  const showMesai = mode === 'mesai' && workLog && hasMesai;
  const hasContent = showWork || showMesai || deductions.length > 0 || minimumWages.length > 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
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
        className="relative w-full sm:max-w-md max-h-[min(88dvh,640px)] overflow-y-auto bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl safe-pb"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
          <div className="flex items-start gap-3 min-w-0">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600">
              <FiCalendar className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {mode === 'work' ? strings.workSection : strings.mesaiSection}
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

        <div className="px-5 py-4 space-y-4">
          {!hasContent ? (
            <div className="py-8 text-center">
              <p className="font-medium text-slate-900 dark:text-white">{strings.noRecordTitle}</p>
              <p className="mt-1 text-sm text-slate-500">{strings.noRecordHint}</p>
            </div>
          ) : null}

          {showWork && workLog && status ? (
            <section className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
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
                {status === 'confirmed' && isQr ? (
                  <div className="flex items-end justify-end">
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
                <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-3 py-2.5">
                  <p className="text-xs font-semibold text-red-700 dark:text-red-300">{strings.disputeLabel}</p>
                  <p className="mt-1 text-sm text-red-800 dark:text-red-200">{workLog.employee_dispute_note}</p>
                </div>
              ) : null}
            </section>
          ) : null}

          {showMesai && workLog && status ? (
            <section className="rounded-2xl border border-orange-200 dark:border-orange-900/40 bg-orange-50/50 dark:bg-orange-950/20 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-orange-700/80 dark:text-orange-300/80">
                  {strings.mesaiSection}
                </p>
                <PersonnelBadge variant={statusTone(status)}>{statusLabel(status, strings)}</PersonnelBadge>
              </div>
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
              {workLog.employee_dispute_note ? (
                <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-3 py-2.5">
                  <p className="text-xs font-semibold text-red-700 dark:text-red-300">{strings.disputeLabel}</p>
                  <p className="mt-1 text-sm text-red-800 dark:text-red-200">{workLog.employee_dispute_note}</p>
                </div>
              ) : null}
            </section>
          ) : null}

          {deductions.length > 0 ? (
            <section className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <p className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                {strings.deductionsSection}
              </p>
              <ul>
                {deductions.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {deductionTypeLabel(item.type)}
                      </p>
                      {item.description ? (
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{item.description}</p>
                      ) : null}
                    </div>
                    <p className="text-sm font-semibold tabular-nums text-slate-900 dark:text-white shrink-0">
                      {formatMoney(item.amount)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {minimumWages.length > 0 ? (
            <section className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <p className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                {strings.minimumSection}
              </p>
              <ul>
                {minimumWages.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0"
                  >
                    <p className="text-sm text-slate-700 dark:text-slate-300 truncate">
                      {item.description || strings.minimumSection}
                    </p>
                    <p className="text-sm font-semibold tabular-nums text-emerald-700 dark:text-emerald-300 shrink-0">
                      {formatMoney(item.amount)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
