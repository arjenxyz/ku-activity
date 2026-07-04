'use client';

import dayjs from 'dayjs';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiHelpCircle,
  FiInfo,
  FiShield,
  FiTrendingUp,
} from 'react-icons/fi';
import { PersonnelMonthFilter } from './PersonnelMonthFilter';
import { PersonnelRecordRow, PersonnelSection } from './PersonnelRecordCard';
import { PersonnelStatGrid } from './PersonnelStatGrid';
import { formatDate, formatMoney } from '@/lib/format';
import type { PersonnelAsgariSummary } from '@/hooks/usePersonnelAsgari';
import {
  PRORATION_MODE_LABELS,
  YEVMIYE_TRIGGER_LABELS,
} from '@/types/wage-policy';
import { formatString } from '@/lib/strings/format';
import { getRegistryStrings } from '@/lib/i18n/strings-registry';

type Props = {
  month: string;
  onMonthChange: (month: string) => void;
  data: PersonnelAsgariSummary | null;
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
};

function statusMeta(
  status: PersonnelAsgariSummary['gap']['paymentStatus'],
  strings: ReturnType<typeof getRegistryStrings<'components/personnel/PersonnelAsgariPanel'>>
) {

  switch (status) {
    case 'complete':
      return {
        label: strings.status.complete.label,
        sub: strings.status.complete.sub,
        tone: 'from-emerald-600 to-teal-600',
        icon: <FiCheckCircle className="w-8 h-8 text-emerald-100" />,
      };
    case 'partial':
      return {
        label: strings.status.partial.label,
        sub: strings.status.partial.sub,
        tone: 'from-amber-500 to-orange-600',
        icon: <FiClock className="w-8 h-8 text-amber-100" />,
      };
    case 'open':
      return {
        label: strings.status.open.label,
        sub: strings.status.open.sub,
        tone: 'from-indigo-600 to-violet-600',
        icon: <FiAlertCircle className="w-8 h-8 text-indigo-100" />,
      };
    default:
      return {
        label: strings.status.default.label,
        sub: strings.status.default.sub,
        tone: 'from-slate-600 to-slate-700',
        icon: <FiInfo className="w-8 h-8 text-slate-200" />,
      };
  }
}

export function PersonnelAsgariPanel({
  month,
  onMonthChange,
  data,
  loading,
  error,
  onRetry,
}: Props) {

  const strings = useRegistryStrings('components/personnel/PersonnelAsgariPanel');
  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500 dark:text-gray-400">{strings.loading}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-6 text-center space-y-3">
        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="text-sm font-medium text-red-800 dark:text-red-200 underline"
          >
            {strings.retry}
          </button>
        )}
      </div>
    );
  }

  if (!data) return null;

  const meta = statusMeta(data.gap.paymentStatus, strings);
  const progressDen = data.gap.eligibleMinimum || 1;
  const progressNum = Math.min(
    100,
    Math.round(((data.earnings.approvedGross + data.earnings.minimumPaid) / progressDen) * 100)
  );
  const monthLabel = dayjs(`${month}-01`).format('MMMM YYYY');

  return (
    <div className="space-y-6">
      <PersonnelMonthFilter month={month} onChange={onMonthChange} />

      {!data.policyConfigured && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/25 p-4 flex gap-3 text-sm text-amber-900 dark:text-amber-200">
          <FiInfo className="w-5 h-5 shrink-0" />
          <p>{strings.policyNotConfigured}</p>
        </div>
      )}

      <div className={`rounded-2xl bg-gradient-to-br ${meta.tone} p-6 text-white shadow-lg shadow-indigo-500/20`}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-white/80 capitalize">{monthLabel}</p>
            <p className="text-2xl sm:text-3xl font-bold mt-1">{meta.label}</p>
            <p className="text-sm text-white/85 mt-2 leading-relaxed">{meta.sub}</p>
            {data.gap.paymentStatus === 'open' || data.gap.paymentStatus === 'partial' ? (
              <p className="text-3xl sm:text-4xl font-bold mt-4 tabular-nums">
                {formatMoney(data.gap.remainingGap)}
                <span className="text-base font-normal text-white/75 ml-2">{strings.estimatedRemaining}</span>
              </p>
            ) : data.gap.paymentStatus === 'complete' ? (
              <p className="text-lg font-semibold mt-4 text-emerald-100">{strings.noExtraCompletion}</p>
            ) : null}
          </div>
          <div className="shrink-0 opacity-90">{meta.icon}</div>
        </div>

        {data.gap.eligibleMinimum > 0 && (
          <div className="mt-5">
            <div className="flex justify-between text-xs text-white/75 mb-1.5">
              <span>{strings.progressLabel}</span>
              <span>{progressNum}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-white/90 transition-all duration-500"
                style={{ width: `${progressNum}%` }}
              />
            </div>
            <p className="text-xs text-white/70 mt-2">
              {formatString(strings.targetLine, { amount: formatMoney(data.gap.eligibleMinimum) })}
            </p>
          </div>
        )}
      </div>

      <PersonnelStatGrid
        items={[
          {
            label: strings.stats.approvedGross,
            value: formatMoney(data.earnings.approvedGross),
            icon: <FiTrendingUp className="w-5 h-5 text-emerald-600" />,
            accent: 'bg-emerald-50 dark:bg-emerald-900/30',
          },
          {
            label: strings.stats.eligibleMinimum,
            value: formatMoney(data.gap.eligibleMinimum),
            icon: <FiShield className="w-5 h-5 text-indigo-600" />,
            accent: 'bg-indigo-50 dark:bg-indigo-900/30',
          },
          {
            label: strings.stats.minimumPaid,
            value: formatMoney(data.earnings.minimumPaid),
            icon: <FiCheckCircle className="w-5 h-5 text-violet-600" />,
            accent: 'bg-violet-50 dark:bg-violet-900/30',
          },
          {
            label: strings.stats.remainingGap,
            value: formatMoney(data.gap.remainingGap),
            icon: <FiAlertCircle className="w-5 h-5 text-amber-600" />,
            accent: 'bg-amber-50 dark:bg-amber-900/30',
          },
        ]}
      />

      <div className="rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
        <p className="px-4 sm:px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-slate-700">
          {strings.howCalculated}
        </p>
        <ul className="divide-y divide-gray-50 dark:divide-slate-700/80 text-sm">
          {[
            {
              label: strings.calcRows.approvedGross,
              value: formatMoney(data.earnings.approvedGross),
              hint: formatString(strings.approvedDaysHint, { days: data.earnings.approvedDays }),
            },
            {
              label: strings.calcRows.eligibleMinimum,
              value: formatMoney(data.gap.eligibleMinimum),
              hint: data.hireDate
                ? PRORATION_MODE_LABELS[data.policy.prorationMode]
                : strings.fullPeriod,
            },
            {
              label: strings.calcRows.minimumPaid,
              value: formatMoney(data.earnings.minimumPaid),
            },
            {
              label: strings.calcRows.remainingGap,
              value: formatMoney(data.gap.remainingGap),
              bold: true,
            },
          ].map((row) => (
            <li
              key={row.label}
              className="flex items-center justify-between px-4 sm:px-6 py-3.5 gap-4"
            >
              <div>
                <span className="text-gray-600 dark:text-gray-300">{row.label}</span>
                {row.hint && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{row.hint}</p>
                )}
              </div>
              <span
                className={`tabular-nums ${row.bold ? 'font-bold text-indigo-600 dark:text-indigo-400 text-base' : 'font-semibold text-gray-900 dark:text-white'}`}
              >
                {row.value}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-4 sm:p-5">
        <div className="flex gap-3">
          <FiClock className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <p className="font-medium text-gray-900 dark:text-white">{strings.paymentTimingTitle}</p>
            <p className="text-gray-600 dark:text-gray-300">
              {data.policy.yevmiyePaymentTriggers
                .map((t) => YEVMIYE_TRIGGER_LABELS[t])
                .join(' · ')}
            </p>
            {data.policy.yevmiyePaymentNotes && (
              <p className="text-xs text-gray-500 dark:text-gray-400">{data.policy.yevmiyePaymentNotes}</p>
            )}
          </div>
        </div>
      </div>

      <PersonnelSection
        title={formatString(strings.recordsTitle, { month: monthLabel })}
        icon={<FiShield className="w-5 h-5 text-indigo-600" />}
        isEmpty={data.records.length === 0}
        emptyMessage={strings.emptyRecords}
      >
        <div>
          {data.records.map((r) => (
            <PersonnelRecordRow
              key={r.id}
              left={formatDate(r.date)}
              right={formatMoney(Number(r.amount))}
              sub={r.description || strings.defaultRecordDescription}
            />
          ))}
        </div>
        {data.records.length > 0 && (
          <p className="px-4 py-3 text-sm text-right font-semibold text-gray-700 dark:text-gray-200 border-t border-gray-100 dark:border-slate-700">
            {formatString(strings.total, { amount: formatMoney(data.earnings.minimumPaid) })}
          </p>
        )}
      </PersonnelSection>

      <details className="rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 group">
        <summary className="flex items-center gap-2 px-4 sm:px-6 py-4 cursor-pointer list-none text-sm font-medium text-gray-700 dark:text-gray-200">
          <FiHelpCircle className="w-4 h-4 text-indigo-600" />
          {strings.faqTitle}
          <span className="ml-auto text-gray-400 group-open:rotate-180 transition-transform">▾</span>
        </summary>
        <div className="px-4 sm:px-6 pb-5 space-y-3 text-sm text-gray-600 dark:text-gray-300 border-t border-gray-50 dark:border-slate-700/80 pt-4">
          <p>
            <strong className="text-gray-900 dark:text-white">{strings.faq.whatIs.question}</strong>
            <br />
            {strings.faq.whatIs.answer}
          </p>
          <p>
            <strong className="text-gray-900 dark:text-white">{strings.faq.whenFinal.question}</strong>
            <br />
            {strings.faq.whenFinal.answer}
          </p>
          {data.hireDate && (
            <p>
              <strong className="text-gray-900 dark:text-white">{strings.faq.hireDate}</strong>{' '}
              {formatString(strings.faq.hireDateNote, { date: formatDate(data.hireDate) })}
            </p>
          )}
        </div>
      </details>
    </div>
  );
}
