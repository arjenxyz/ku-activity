'use client';

import strings from '@json/src/app/admin-panel/proje/[projectId]/asgari/page.json';
import { formatString } from '@/lib/strings/format';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import dayjs from 'dayjs';
import { FiExternalLink, FiInfo } from 'react-icons/fi';
import { ProjectPageHeader } from '@/components/project/ProjectPageHeader';
import { AlertBanner } from '@/components/project/AlertBanner';
import { EmployeeSelect } from '@/components/project/EmployeeSelect';
import { RecordsTable } from '@/components/project/RecordsTable';
import { useProjectEmployees } from '@/hooks/useProjectEmployees';
import { fetchRecords, postMinimumWage } from '@/lib/project-api';
import { formatMoney, formatDate } from '@/lib/format';
import { computeMinimumWageGapWithPolicy, type ResolvedWagePolicy } from '@/lib/wage-policy-calc';
import { computeGrossPay, type WorkLog } from '@/lib/personnel-stats';
import { YEVMIYE_TRIGGER_LABELS, DEFAULT_WAGE_POLICY, type WagePolicy } from '@/types/wage-policy';
import { cardClass, labelClass, inputClass, btnPrimary, btnSecondary } from '@/components/project/ui';

type MinimumRecord = {
  id: string;
  date: string;
  amount: number;
  description?: string | null;
};

export default function AsgariPage() {
  const { projectId } = useParams() as { projectId: string };
  const { employees, loading: empLoading, error: empError } = useProjectEmployees(projectId);
  const [employeeId, setEmployeeId] = useState('');
  const [month, setMonth] = useState(dayjs().format('YYYY-MM'));
  const [values, setValues] = useState({
    date: dayjs().format('YYYY-MM-DD'),
    amount: '',
    description: strings.defaultDescription,
  });
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [monthRecords, setMonthRecords] = useState<MinimumRecord[]>([]);
  const [approvedGross, setApprovedGross] = useState(0);
  const [workedDays, setWorkedDays] = useState(0);
  const [wagePolicy, setWagePolicy] = useState<ResolvedWagePolicy | null>(null);

  const selectedEmployee = employees.find((e) => e.id === employeeId);
  const dailyWage = selectedEmployee ? Number(selectedEmployee.daily_wage) : 0;

  useEffect(() => {
    fetch(`/api/admin/projects/${projectId}/wage-policy`)
      .then(async (res) => (res.ok ? res.json() : null))
      .then((d) => setWagePolicy(d?.resolved ?? null))
      .catch(() => setWagePolicy(null));
  }, [projectId]);

  const loadPreview = useCallback(async () => {
    if (!employeeId) {
      setMonthRecords([]);
      setApprovedGross(0);
      return;
    }
    setPreviewLoading(true);
    try {
      const [logsRes, minRes] = await Promise.all([
        fetchRecords(projectId, 'work-logs', { employeeId, month, approved: 'true' }),
        fetchRecords(projectId, 'minimum-wages', { employeeId, month }),
      ]);
      const logs = (logsRes.records ?? []) as WorkLog[];
      const { gross, workDays } = computeGrossPay(logs, dailyWage, { approvedOnly: true });
      setApprovedGross(gross);
      setWorkedDays(workDays);
      setMonthRecords(minRes.records ?? []);
    } catch {
      setApprovedGross(0);
      setMonthRecords([]);
    } finally {
      setPreviewLoading(false);
    }
  }, [projectId, employeeId, month, dailyWage]);

  useEffect(() => {
    void loadPreview();
  }, [loadPreview]);

  const minimumPaid = useMemo(
    () => monthRecords.reduce((s, r) => s + Number(r.amount), 0),
    [monthRecords]
  );

  const policy: WagePolicy = wagePolicy ?? DEFAULT_WAGE_POLICY;

  const gap = useMemo(
    () =>
      employeeId
        ? computeMinimumWageGapWithPolicy({
            month,
            hireDate: selectedEmployee?.hire_date,
            grossEarned: approvedGross,
            minimumPaid,
            workedDays,
            policy,
          })
        : null,
    [employeeId, month, selectedEmployee?.hire_date, approvedGross, minimumPaid, workedDays, policy]
  );

  const handleFillSuggested = () => {
    if (!gap || gap.suggestedTopUp <= 0) return;
    setValues((s) => ({
      ...s,
      amount: gap.suggestedTopUp.toFixed(2),
      description: s.description || strings.defaultDescription,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!employeeId || !values.amount) {
      setError(strings.employeeAmountRequired);
      return;
    }
    setLoading(true);
    try {
      await postMinimumWage(projectId, {
        employeeId,
        date: values.date,
        amount: Number(values.amount),
        description: values.description || undefined,
      });
      setSuccess(strings.successCreated);
      setValues({
        date: dayjs().format('YYYY-MM-DD'),
        amount: '',
        description: strings.defaultDescription,
      });
      await loadPreview();
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.saveFailed);
    } finally {
      setLoading(false);
    }
  };

  const policyConfigured = wagePolicy?.configuredAt != null;

  return (
    <div>
      <ProjectPageHeader title={strings.pageTitle} description={strings.pageDescription} />
      <p className="-mt-4 mb-6 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <Link
          href={`/admin-panel/proje/${projectId}/sorgulama/asgari`}
          className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700"
        >
          {strings.linkAsgariQuery}
          <FiExternalLink className="w-4 h-4" />
        </Link>
        <Link
          href={`/admin-panel/proje/${projectId}/maas-politikasi`}
          className="text-indigo-600 hover:text-indigo-700"
        >
          {strings.linkWagePolicy}
        </Link>
      </p>

      {empError && <AlertBanner type="error" message={empError} />}
      {error && <AlertBanner type="error" message={error} />}
      {success && <AlertBanner type="success" message={success} />}

      {!policyConfigured && (
        <AlertBanner type="error" message={strings.policyNotConfigured} />
      )}

      <div className={`${cardClass} p-4 sm:p-6 mb-6 border-indigo-100 bg-indigo-50/50`}>
        <div className="flex gap-3">
          <FiInfo className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="text-sm text-slate-700 space-y-1">
            <p>
              <strong>{strings.infoGapFormula}</strong> {strings.infoGapFormulaDetail}
            </p>
            <p className="text-xs text-slate-500">
              {strings.infoYevmiyePaymentPrefix}{' '}
              {policy.yevmiyePaymentTriggers.map((t) => YEVMIYE_TRIGGER_LABELS[t]).join(' · ')}
              {policy.yevmiyePaymentNotes ? ` — ${policy.yevmiyePaymentNotes}` : ''}
            </p>
          </div>
        </div>
      </div>

      <div className={`${cardClass} p-4 sm:p-6 mb-6`}>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">{strings.sectionPeriodEmployee}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>{strings.labelMonth}</label>
            <input
              type="month"
              className={inputClass}
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>
          <EmployeeSelect employees={employees} value={employeeId} onChange={setEmployeeId} />
        </div>
      </div>

      {employeeId && (
        <div className={`${cardClass} p-4 sm:p-6 mb-6`}>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
            {selectedEmployee?.name} · {dayjs(`${month}-01`).format('MMMM YYYY')}
          </h2>
          {previewLoading ? (
            <p className="text-sm text-slate-500">{strings.calculating}</p>
          ) : gap ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: strings.labelApprovedYevmiye, value: formatMoney(gap.grossEarned) },
                { label: strings.labelPaidMinimum, value: formatMoney(gap.minimumPaid) },
                { label: strings.labelEligibleMinimum, value: formatMoney(gap.eligibleMinimum) },
                {
                  label: gap.isBelowMinimum ? strings.labelSubcontractorGap : strings.labelStatus,
                  value: gap.isBelowMinimum ? formatMoney(gap.suggestedTopUp) : strings.statusComplete,
                  highlight: gap.isBelowMinimum && gap.suggestedTopUp > 0,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`rounded-xl p-3 ${
                    item.highlight
                      ? 'bg-amber-50 dark:bg-amber-950/30 ring-1 ring-amber-200 dark:ring-amber-800'
                      : 'bg-slate-50 dark:bg-slate-900/50'
                  }`}
                >
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className="text-base font-semibold text-slate-900 dark:text-white mt-1">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
          {gap && gap.suggestedTopUp > 0 && (
            <button type="button" className={btnSecondary} onClick={handleFillSuggested}>
              {formatString(strings.fillSuggestedButton, { amount: formatMoney(gap.suggestedTopUp) })}
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className={`${cardClass} p-4 sm:p-6 mb-6`}>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">{strings.sectionNewPayment}</h2>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>{strings.labelDate}</label>
            <input
              type="date"
              className={inputClass}
              value={values.date}
              onChange={(e) => setValues((s) => ({ ...s, date: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className={labelClass}>{strings.labelAmount}</label>
            <input
              type="number"
              className={inputClass}
              value={values.amount}
              onChange={(e) => setValues((s) => ({ ...s, amount: e.target.value }))}
              step="0.01"
              min="0"
              required
            />
          </div>

          <div>
            <label className={labelClass}>{strings.labelDescription}</label>
            <textarea
              className={`${inputClass} min-h-[80px] resize-y`}
              value={values.description}
              onChange={(e) => setValues((s) => ({ ...s, description: e.target.value }))}
            />
          </div>

          <button type="submit" className={btnPrimary} disabled={loading || empLoading || !employeeId}>
            {loading ? strings.saving : strings.saveButton}
          </button>
        </div>
      </form>

      {employeeId && monthRecords.length > 0 && (
        <RecordsTable
          loading={previewLoading}
          rows={monthRecords}
          emptyMessage={strings.emptyRecords}
          columns={[
            { key: 'date', header: strings.colDate, render: (r) => formatDate(r.date) },
            { key: 'amount', header: strings.colAmount, render: (r) => formatMoney(Number(r.amount)) },
            {
              key: 'desc',
              header: strings.colDescription,
              render: (r) => r.description || strings.emptyCell,
              hideOnMobile: true,
            },
          ]}
        />
      )}

      {employeeId && monthRecords.length > 0 && (
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 text-right font-medium">
          {formatString(strings.periodTotal, { amount: formatMoney(minimumPaid) })}
        </p>
      )}
    </div>
  );
}
