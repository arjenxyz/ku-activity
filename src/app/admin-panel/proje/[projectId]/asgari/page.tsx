'use client';

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
    description: 'Asgari ücret tamamlama',
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
      description: s.description || 'Asgari ücret tamamlama',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!employeeId || !values.amount) {
      setError('Personel ve tutar zorunludur.');
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
      setSuccess('Asgari ödeme kaydı oluşturuldu.');
      setValues({
        date: dayjs().format('YYYY-MM-DD'),
        amount: '',
        description: 'Asgari ücret tamamlama',
      });
      await loadPreview();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız');
    } finally {
      setLoading(false);
    }
  };

  const policyConfigured = wagePolicy?.configuredAt != null;

  return (
    <div>
      <ProjectPageHeader
        title="Asgari Ekle"
        description="Yevmiye kazancı, şirket politikanızdaki asgari tavanın altındaysa taşeron farkını kaydedin."
      />
      <p className="-mt-4 mb-6 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <Link
          href={`/admin-panel/proje/${projectId}/sorgulama/asgari`}
          className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700"
        >
          Asgari sorgulama
          <FiExternalLink className="w-4 h-4" />
        </Link>
        <Link
          href={`/admin-panel/proje/${projectId}/maas-politikasi`}
          className="text-indigo-600 hover:text-indigo-700"
        >
          Maaş politikası
        </Link>
      </p>

      {empError && <AlertBanner type="error" message={empError} />}
      {error && <AlertBanner type="error" message={error} />}
      {success && <AlertBanner type="success" message={success} />}

      {!policyConfigured && (
        <AlertBanner
          type="error"
          message="Henüz maaş politikası doldurulmamış. Ana yetkili şirket ayarlarını tamamlamalı."
        />
      )}

      <div className={`${cardClass} p-4 sm:p-6 mb-6 border-indigo-100 bg-indigo-50/50`}>
        <div className="flex gap-3">
          <FiInfo className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="text-sm text-slate-700 space-y-1">
            <p>
              <strong>Taşeron farkı</strong> = Hak edilen asgari − onaylı yevmiye − ödenen asgari
            </p>
            <p className="text-xs text-slate-500">
              Yevmiye ödeme zamanınız:{' '}
              {policy.yevmiyePaymentTriggers.map((t) => YEVMIYE_TRIGGER_LABELS[t]).join(' · ')}
              {policy.yevmiyePaymentNotes ? ` — ${policy.yevmiyePaymentNotes}` : ''}
            </p>
          </div>
        </div>
      </div>

      <div className={`${cardClass} p-4 sm:p-6 mb-6`}>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Dönem ve personel</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Ay</label>
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
            <p className="text-sm text-slate-500">Hesaplanıyor…</p>
          ) : gap ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Onaylı yevmiye', value: formatMoney(gap.grossEarned) },
                { label: 'Ödenen asgari', value: formatMoney(gap.minimumPaid) },
                { label: 'Hak edilen asgari', value: formatMoney(gap.eligibleMinimum) },
                {
                  label: gap.isBelowMinimum ? 'Taşeron farkı' : 'Durum',
                  value: gap.isBelowMinimum ? formatMoney(gap.suggestedTopUp) : 'Tamamlandı',
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
              Önerilen tutarı forma yaz ({formatMoney(gap.suggestedTopUp)})
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className={`${cardClass} p-4 sm:p-6 mb-6`}>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Yeni Asgari Ödeme</h2>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Tarih *</label>
            <input
              type="date"
              className={inputClass}
              value={values.date}
              onChange={(e) => setValues((s) => ({ ...s, date: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Tutar (₺) *</label>
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
            <label className={labelClass}>Açıklama</label>
            <textarea
              className={`${inputClass} min-h-[80px] resize-y`}
              value={values.description}
              onChange={(e) => setValues((s) => ({ ...s, description: e.target.value }))}
            />
          </div>

          <button type="submit" className={btnPrimary} disabled={loading || empLoading || !employeeId}>
            {loading ? 'Kaydediliyor…' : 'Asgari ödeme kaydet'}
          </button>
        </div>
      </form>

      {employeeId && monthRecords.length > 0 && (
        <RecordsTable
          loading={previewLoading}
          rows={monthRecords}
          emptyMessage="Bu dönem için kayıt yok."
          columns={[
            { key: 'date', header: 'Tarih', render: (r) => formatDate(r.date) },
            { key: 'amount', header: 'Tutar', render: (r) => formatMoney(Number(r.amount)) },
            {
              key: 'desc',
              header: 'Açıklama',
              render: (r) => r.description || '—',
              hideOnMobile: true,
            },
          ]}
        />
      )}

      {employeeId && monthRecords.length > 0 && (
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 text-right font-medium">
          Dönem toplamı: {formatMoney(minimumPaid)}
        </p>
      )}
    </div>
  );
}
