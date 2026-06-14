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
import {
  computeMinimumWageGap,
  getOfficialMonthlyMinimumWageGross,
  getOfficialMonthlyMinimumWageNet,
} from '@/lib/minimum-wage';
import { computeGrossPay, type WorkLog } from '@/lib/personnel-stats';
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

  const selectedEmployee = employees.find((e) => e.id === employeeId);
  const dailyWage = selectedEmployee ? Number(selectedEmployee.daily_wage) : 0;

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
      const { gross } = computeGrossPay(logs, dailyWage);
      setApprovedGross(gross);
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

  const gap = useMemo(
    () =>
      employeeId
        ? computeMinimumWageGap({ grossEarned: approvedGross, minimumPaid })
        : null,
    [employeeId, approvedGross, minimumPaid]
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

  const officialGross = getOfficialMonthlyMinimumWageGross();
  const officialNet = getOfficialMonthlyMinimumWageNet();

  return (
    <div>
      <ProjectPageHeader
        title="Asgari Ekle"
        description="Yevmiye kazancı resmi asgari ücretin altındaysa tamamlama ödemesi kaydedin."
      />
      <p className="-mt-4 mb-6">
        <Link
          href={`/admin-panel/proje/${projectId}/sorgulama/asgari`}
          className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
        >
          Asgari sorgulama ve düzenleme
          <FiExternalLink className="w-4 h-4" />
        </Link>
      </p>

      {empError && <AlertBanner type="error" message={empError} />}
      {error && <AlertBanner type="error" message={error} />}
      {success && <AlertBanner type="success" message={success} />}

      <div className={`${cardClass} p-4 sm:p-6 mb-6 border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-950/20`}>
        <div className="flex gap-3">
          <FiInfo className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
            <p>
              2026 resmi brüt asgari ücret: <strong>{formatMoney(officialGross)}</strong> (net:{' '}
              {formatMoney(officialNet)}). Onaylı yevmiye + mesai brütü bu tutarın altındaysa
              farkı asgari tamamlama olarak ödeyebilirsiniz.
            </p>
            <p className="text-xs text-slate-500">
              Önerilen tutar yalnızca onaylı yevmiye kayıtlarına göre hesaplanır; avans ve kesintiler
              net ödemede ayrıca düşülür.
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
                { label: 'Onaylı brüt kazanç', value: formatMoney(gap.grossEarned) },
                { label: 'Ödenen asgari', value: formatMoney(gap.minimumPaid) },
                { label: 'Resmi asgari (brüt)', value: formatMoney(gap.officialGross) },
                {
                  label: gap.isBelowMinimum ? 'Önerilen tamamlama' : 'Durum',
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
