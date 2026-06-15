'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import dayjs from 'dayjs';
import { ProjectPageHeader } from '@/components/project/ProjectPageHeader';
import { EntryFormCard } from '@/components/project/EntryFormCard';
import { AlertBanner } from '@/components/project/AlertBanner';
import { useProjectEmployees } from '@/hooks/useProjectEmployees';
import { useProjectJobs } from '@/hooks/useProjectJobs';
import { postWorkLog } from '@/lib/project-api';
import { MESAI_OPTIONS } from '@/lib/work-log';
import { JobSelectField } from '@/components/project/JobSelectField';
import { labelClass, inputClass, cardClass } from '@/components/project/ui';

export default function YevmiyePage() {
  const { projectId } = useParams() as { projectId: string };
  const { employees, loading: empLoading, error: empError } = useProjectEmployees(projectId);
  const { jobs } = useProjectJobs(projectId);
  const [employeeId, setEmployeeId] = useState('');
  const [jobId, setJobId] = useState('');
  const [values, setValues] = useState({
    date: dayjs().format('YYYY-MM-DD'),
    amount: '1',
    mesaiType: 'none' as 'none' | 'ceyrek' | 'yarim' | 'tam',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!employeeId || !values.amount) {
      setError('Personel ve gün sayısı zorunludur.');
      return;
    }
    setLoading(true);
    try {
      await postWorkLog(projectId, {
        employeeId,
        date: values.date,
        amount: Number(values.amount),
        mesaiType: Number(values.amount) < 1 ? 'none' : values.mesaiType,
        description: values.description || undefined,
        jobId: jobId || null,
      });
      setSuccess('Yönetici onayı kaydedildi — personel onayı bekleniyor.');
      setValues({
        date: dayjs().format('YYYY-MM-DD'),
        amount: '1',
        mesaiType: 'none',
        description: '',
      });
      setEmployeeId('');
      setJobId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <ProjectPageHeader
        title="Yevmiye Ekle"
        description="Yönetici onayı — personel de onaylayınca gün kesinleşir."
      />
      {empError && <AlertBanner type="error" message={empError} />}
      {error && <AlertBanner type="error" message={error} />}
      {success && <AlertBanner type="success" message={success} />}
      <EntryFormCard
        title="Yeni Yevmiye"
        employees={employees}
        employeeId={employeeId}
        onEmployeeChange={setEmployeeId}
        fields={[
          { name: 'date', label: 'Tarih', type: 'date' },
          { name: 'amount', label: 'Gün (1=tam, 0.5=yarım)', type: 'number', step: '0.5' },
          { name: 'description', label: 'Açıklama', type: 'textarea', required: false },
        ]}
        values={values}
        onChange={(n, v) => {
          setValues((s) => {
            const next = { ...s, [n]: v };
            if (n === 'amount' && Number(v) < 1) next.mesaiType = 'none';
            return next;
          });
        }}
        onSubmit={handleSubmit}
        loading={loading || empLoading}
      />
      {jobs.length > 0 && (
        <div className={`${cardClass} p-4 sm:p-6 max-w-xl -mt-4 mb-2`}>
          <JobSelectField jobs={jobs} value={jobId} onChange={setJobId} />
        </div>
      )}
      <div className={`${cardClass} p-4 sm:p-6 max-w-xl -mt-4 mb-6`}>
        <label className={labelClass}>Mesai (yalnızca tam günde)</label>
        <select
          className={inputClass}
          value={values.mesaiType}
          disabled={Number(values.amount) < 1}
          onChange={(e) =>
            setValues((s) => ({
              ...s,
              mesaiType: e.target.value as 'none' | 'ceyrek' | 'yarim' | 'tam',
            }))
          }
        >
          {MESAI_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-500 mt-2">
          Çeyrek = günlük yevmiyenin %25’i ek · Yarım = %50 · Tam = bir günlük yevmiye ek
        </p>
      </div>
    </div>
  );
}
