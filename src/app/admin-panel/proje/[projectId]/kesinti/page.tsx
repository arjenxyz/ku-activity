'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import dayjs from 'dayjs';
import { ProjectPageHeader } from '@/components/project/ProjectPageHeader';
import { AlertBanner } from '@/components/project/AlertBanner';
import { EmployeeSelect } from '@/components/project/EmployeeSelect';
import { JobSelectField } from '@/components/project/JobSelectField';
import { useProjectEmployees } from '@/hooks/useProjectEmployees';
import { useProjectJobs } from '@/hooks/useProjectJobs';
import { postDeduction } from '@/lib/project-api';
import { cardClass, labelClass, inputClass, btnPrimary } from '@/components/project/ui';

const DEDUCTION_TYPES = [
  { value: 'deduction', label: 'Kesinti' },
  { value: 'subcontractor_cut', label: 'Taşeron kesintisi' },
  { value: 'other', label: 'Diğer' },
] as const;

export default function KesintiPage() {
  const { projectId } = useParams() as { projectId: string };
  const searchParams = useSearchParams();
  const { employees, loading: empLoading, error: empError } = useProjectEmployees(projectId);
  const { jobs } = useProjectJobs(projectId);
  const [employeeId, setEmployeeId] = useState('');
  const [jobId, setJobId] = useState('');
  const [deductionType, setDeductionType] = useState<(typeof DEDUCTION_TYPES)[number]['value']>(
    'deduction'
  );
  const [values, setValues] = useState({
    date: dayjs().format('YYYY-MM-DD'),
    amount: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fromUrl = searchParams.get('job');
    if (fromUrl && jobs.some((j) => j.id === fromUrl)) {
      setJobId(fromUrl);
    }
  }, [searchParams, jobs]);

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
      await postDeduction(projectId, {
        employeeId,
        date: values.date,
        type: deductionType,
        amount: Number(values.amount),
        description: values.description || undefined,
        jobId: jobId || null,
      });
      setSuccess('Kesinti kaydı oluşturuldu.');
      setValues({ date: dayjs().format('YYYY-MM-DD'), amount: '', description: '' });
      setEmployeeId('');
      setJobId('');
      setDeductionType('deduction');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <ProjectPageHeader
        title="Kesinti Ekle"
        description="Personel maaşından düşülecek kesinti kaydı girin."
      />
      {empError && <AlertBanner type="error" message={empError} />}
      {error && <AlertBanner type="error" message={error} />}
      {success && <AlertBanner type="success" message={success} />}

      <form onSubmit={handleSubmit} className={`${cardClass} p-4 sm:p-6 mb-6`}>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Yeni Kesinti</h2>
        <div className="space-y-4">
          <EmployeeSelect employees={employees} value={employeeId} onChange={setEmployeeId} />

          <div>
            <label className={labelClass}>Kesinti türü *</label>
            <select
              className={inputClass}
              value={deductionType}
              onChange={(e) =>
                setDeductionType(e.target.value as (typeof DEDUCTION_TYPES)[number]['value'])
              }
            >
              {DEDUCTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

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

          {jobs.length > 0 && (
            <JobSelectField jobs={jobs} value={jobId} onChange={setJobId} />
          )}

          <button type="submit" className={btnPrimary} disabled={loading || empLoading}>
            {loading ? 'Kaydediliyor…' : 'Kesinti kaydet'}
          </button>
        </div>
      </form>
    </div>
  );
}
