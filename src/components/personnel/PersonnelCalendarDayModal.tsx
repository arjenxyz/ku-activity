'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { FiX } from 'react-icons/fi';
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
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import {
  fetchPersonnelDayReports,
  submitPersonnelDayReport,
  type DayErrorCategory,
} from '@/lib/personnel-api';

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

type Strings = ReturnType<typeof useRegistryStrings<'components/personnel/PersonnelCalendarDayModal'>>;

const CATEGORY_OPTIONS: { id: DayErrorCategory; labelKey: keyof Strings['categories'] }[] = [
  { id: 'work', labelKey: 'work' },
  { id: 'mesai', labelKey: 'mesai' },
  { id: 'advance', labelKey: 'advance' },
  { id: 'deduction', labelKey: 'deduction' },
  { id: 'minimum', labelKey: 'minimum' },
];

function statusLabel(status: WorkLogApprovalStatus, strings: Strings) {
  if (status === 'none') return strings.status.none;
  return strings.status[status as keyof typeof strings.status] ?? strings.status.none;
}

function statusClass(status: WorkLogApprovalStatus) {
  if (status === 'confirmed') return 'text-emerald-700 dark:text-emerald-300';
  if (status === 'disputed') return 'text-amber-700 dark:text-amber-300';
  if (status === 'pending_employee' || status === 'pending_admin') {
    return 'text-sky-700 dark:text-sky-300';
  }
  return 'text-slate-600 dark:text-slate-300';
}

function isQrWorkLog(workLog: WorkLog) {
  return workLog.description?.toLowerCase().includes('qr') ?? false;
}

/** Skip description when it only repeats the QR attendance source. */
function shouldShowDescription(workLog: WorkLog) {
  const description = workLog.description?.trim();
  if (!description) return false;
  if (isQrWorkLog(workLog) && /qr/i.test(description)) return false;
  return true;
}

function DetailRow({
  label,
  value,
  valueClassName = 'text-[#0E1548] dark:text-white',
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3 last:border-0 dark:border-slate-800">
      <p className="shrink-0 text-[13px] text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`min-w-0 text-right text-[13px] font-semibold tabular-nums ${valueClassName}`}>
        {value}
      </p>
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-800/40">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          {title}
        </p>
      </div>
      <div className="px-4">{children}</div>
    </section>
  );
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
    <SectionCard title={title}>
      {items.map((item) => (
        <DetailRow
          key={item.id}
          label={item.description?.trim() || title}
          value={formatMoney(item.amount)}
          valueClassName={amountClassName ?? 'text-[#0E1548] dark:text-white'}
        />
      ))}
    </SectionCard>
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

  const [reportOpen, setReportOpen] = useState(false);
  const [selected, setSelected] = useState<DayErrorCategory[]>([]);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [hasOpenReport, setHasOpenReport] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (reportOpen) setReportOpen(false);
        else onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose, reportOpen]);

  useEffect(() => {
    if (!open || !date) return;
    setReportOpen(false);
    setSelected([]);
    setNote('');
    setFormError(null);
    setSuccessMsg(null);
    setHasOpenReport(false);

    let cancelled = false;
    fetchPersonnelDayReports(date)
      .then((res) => {
        if (cancelled) return;
        setHasOpenReport((res.reports ?? []).some((r) => r.status === 'open'));
      })
      .catch(() => {
        /* ignore */
      });

    return () => {
      cancelled = true;
    };
  }, [open, date]);

  if (!open || !date) return null;

  const status = workLog ? getWorkLogApprovalStatus(workLog) : null;
  const hasMesai = workLog ? Number(workLog.mesai_units ?? 0) > 0 : false;
  const mesaiPay = workLog ? mesaiPayForLog(workLog, dailyWage) : 0;
  const basePay = workLog ? workDayUnitsForLog(workLog) * dailyWage : 0;
  const earningsTotal = basePay + mesaiPay;
  const advanceTotal = advances.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const deductionTotal = otherDeductions.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const minimumTotal = minimumWages.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const outgoingTotal = advanceTotal + deductionTotal;
  const dayBalance = earningsTotal + minimumTotal - outgoingTotal;
  const showDaySummary =
    earningsTotal > 0 || outgoingTotal > 0 || minimumTotal > 0;
  const isQr = workLog ? isQrWorkLog(workLog) : false;
  const showDescription = workLog ? shouldShowDescription(workLog) : false;
  const hasContent =
    Boolean(workLog) ||
    advances.length > 0 ||
    otherDeductions.length > 0 ||
    minimumWages.length > 0;

  function toggleCategory(id: DayErrorCategory) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  async function handleSubmit() {
    if (selected.length === 0) {
      setFormError(strings.report.categoriesRequired);
      return;
    }
    if (note.trim().length < 5) {
      setFormError(strings.report.noteTooShort);
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await submitPersonnelDayReport({ date: date!, categories: selected, note: note.trim() });
      setSuccessMsg(strings.report.success);
      setHasOpenReport(true);
      setReportOpen(false);
      setSelected([]);
      setNote('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : strings.report.submitFailed);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label={strings.close}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-day-modal-title"
        className="safe-pb relative max-h-[min(88dvh,640px)] w-full overflow-y-auto overscroll-none rounded-t-2xl border border-slate-200/80 bg-slate-50 shadow-2xl shadow-slate-900/20 dark:border-slate-700 dark:bg-slate-950 sm:max-w-md sm:rounded-2xl"
        data-allow-scroll
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200/80 bg-white/95 px-4 py-2.5 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
          <div className="min-w-0">
            <h2
              id="calendar-day-modal-title"
              className="text-[15px] font-bold leading-tight tracking-tight text-[#0E1548] dark:text-white"
            >
              {formatDate(date)}
            </h2>
            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">
              {strings.modalTitle}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setReportOpen((v) => !v);
                setFormError(null);
                setSuccessMsg(null);
              }}
              className="inline-flex h-8 items-center rounded-lg bg-[#0E1548] px-3 text-[12px] font-semibold text-white transition hover:bg-[#16206a] dark:bg-sky-600 dark:hover:bg-sky-500"
            >
              {strings.report.button}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label={strings.close}
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-3 px-4 py-4 sm:px-5">
          {successMsg ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
              {successMsg}
            </div>
          ) : null}

          {hasOpenReport && !successMsg ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              {strings.report.openExists}
            </div>
          ) : null}

          {reportOpen ? (
            <section className="overflow-hidden rounded-xl border border-[#0E1548]/20 bg-white dark:border-white/10 dark:bg-slate-900">
              <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-800/40">
                <p className="text-[13px] font-semibold text-[#0E1548] dark:text-white">
                  {strings.report.title}
                </p>
                <p className="mt-0.5 text-[12px] text-slate-500 dark:text-slate-400">
                  {strings.report.hint}
                </p>
              </div>
              <div className="space-y-3 px-4 py-3">
                <div className="space-y-2">
                  {CATEGORY_OPTIONS.map((opt) => {
                    const checked = selected.includes(opt.id);
                    return (
                      <label
                        key={opt.id}
                        className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1 text-[13px] text-slate-700 dark:text-slate-200"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCategory(opt.id)}
                          className="h-4 w-4 rounded border-slate-300 text-[#0E1548] focus:ring-[#0E1548]"
                        />
                        {strings.categories[opt.labelKey]}
                      </label>
                    );
                  })}
                </div>
                <div>
                  <label
                    htmlFor="day-error-note"
                    className="mb-1.5 block text-[12px] font-medium text-slate-600 dark:text-slate-300"
                  >
                    {strings.report.noteLabel}
                  </label>
                  <textarea
                    id="day-error-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder={strings.report.notePlaceholder}
                    className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-800 outline-none ring-[#0E1548] placeholder:text-slate-400 focus:ring-2 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
                {formError ? (
                  <p className="text-[12px] font-medium text-rose-600 dark:text-rose-400">{formError}</p>
                ) : null}
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleSubmit()}
                  className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-[#0E1548] text-[13px] font-semibold text-white transition hover:bg-[#16206a] disabled:opacity-60 dark:bg-sky-600 dark:hover:bg-sky-500"
                >
                  {submitting ? strings.report.submitting : strings.report.submit}
                </button>
              </div>
            </section>
          ) : null}

          {!hasContent ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center dark:border-slate-700 dark:bg-slate-900">
              <p className="text-sm font-semibold text-[#0E1548] dark:text-white">{strings.noRecordTitle}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{strings.noRecordHint}</p>
            </div>
          ) : null}

          {workLog && status ? (
            <SectionCard title={strings.workSection}>
              <DetailRow
                label={strings.statusLabel}
                value={statusLabel(status, strings)}
                valueClassName={statusClass(status)}
              />
              <DetailRow
                label={strings.amountLabel}
                value={workDayLabel(Number(workLog.amount), null)}
              />
              <DetailRow
                label={strings.workPayLabel}
                value={formatMoney(basePay)}
                valueClassName="text-[#0E1548] dark:text-white"
              />
              {status === 'confirmed' && isQr ? (
                <DetailRow label={strings.sourceLabel} value={strings.qrAttendance} />
              ) : null}
              {showDescription ? (
                <DetailRow label={strings.descriptionLabel} value={workLog.description!.trim()} />
              ) : null}
              {workLog.employee_dispute_note ? (
                <div className="border-b border-slate-100 py-3 last:border-0 dark:border-slate-800">
                  <p className="text-[13px] text-slate-500 dark:text-slate-400">{strings.disputeLabel}</p>
                  <p className="mt-1 text-[13px] font-medium leading-relaxed text-rose-700 dark:text-rose-300">
                    {workLog.employee_dispute_note}
                  </p>
                </div>
              ) : null}
            </SectionCard>
          ) : null}

          {workLog && hasMesai && status ? (
            <SectionCard title={strings.mesaiSection}>
              <DetailRow label={strings.mesaiTypeLabel} value={mesaiLabel(workLog.mesai_type)} />
              <DetailRow
                label={strings.mesaiPayLabel}
                value={formatMoney(mesaiPay)}
                valueClassName="text-[#0E1548] dark:text-white"
              />
            </SectionCard>
          ) : null}

          <FinanceList
            title={strings.advanceSection}
            items={advances}
            amountClassName="text-amber-800 dark:text-amber-300"
          />
          <FinanceList
            title={strings.deductionSection}
            items={otherDeductions}
            amountClassName="text-rose-800 dark:text-rose-300"
          />
          <FinanceList
            title={strings.minimumSection}
            items={minimumWages}
            amountClassName="text-violet-800 dark:text-violet-300"
          />

          {showDaySummary ? (
            <section className="overflow-hidden rounded-xl border border-[#0E1548]/15 bg-white dark:border-white/10 dark:bg-slate-900">
              <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-800/40">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  {strings.summarySection}
                </p>
              </div>
              <div className="px-4">
                {earningsTotal > 0 ? (
                  <DetailRow label={strings.earningsTotalLabel} value={formatMoney(earningsTotal)} />
                ) : null}
                {minimumTotal > 0 ? (
                  <DetailRow label={strings.minimumSection} value={formatMoney(minimumTotal)} />
                ) : null}
                {outgoingTotal > 0 ? (
                  <DetailRow
                    label={strings.outgoingTotalLabel}
                    value={`−${formatMoney(outgoingTotal)}`}
                    valueClassName="text-rose-800 dark:text-rose-300"
                  />
                ) : null}
                <div className="flex items-center justify-between gap-4 py-3.5">
                  <p className="text-[13px] font-semibold text-slate-600 dark:text-slate-300">
                    {strings.dayTotalLabel}
                  </p>
                  <p
                    className={`text-base font-bold tabular-nums ${
                      dayBalance < 0
                        ? 'text-rose-800 dark:text-rose-300'
                        : 'text-[#0E1548] dark:text-white'
                    }`}
                  >
                    {formatMoney(dayBalance)}
                  </p>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
