'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import dayjs from 'dayjs';
import { ProjectPageHeader } from '@/components/project/ProjectPageHeader';
import { EntryFormCard } from '@/components/project/EntryFormCard';
import { AlertBanner } from '@/components/project/AlertBanner';
import { JobSelectField } from '@/components/project/JobSelectField';
import { useProjectEmployees } from '@/hooks/useProjectEmployees';
import { useProjectJobs } from '@/hooks/useProjectJobs';
import { postDeduction } from '@/lib/project-api';
import { cardClass } from '@/components/project/ui';

export default function AvansPage() {
  const { projectId } = useParams() as { projectId: string };
  const { employees, loading: empLoading, error: empError } = useProjectEmployees(projectId);
  const { jobs } = useProjectJobs(projectId);
  const [employeeId, setEmployeeId] = useState('');
  const [jobId, setJobId] = useState('');
  const [values, setValues] = useState({
    date: dayjs().format('YYYY-MM-DD'),
    amount: '',
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
      setError('Personel ve tutar zorunludur.');
      return;
    }
    setLoading(true);
    try {
      await postDeduction(projectId, {
        employeeId,
        date: values.date,
        type: 'advance',
        amount: Number(values.amount),
        description: values.description || undefined,
        jobId: jobId || null,
      });
      setSuccess('Avans kaydı oluşturuldu.');
      setValues({ date: dayjs().format('YYYY-MM-DD'), amount: '', description: '' });
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
        title="Avans Ekle"
        description="Personele avans kaydı girin. İsteğe bağlı iş kalemine bağlayarak taşeron kârına yansıtın."
      />
      {empError && <AlertBanner type="error" message={empError} />}
      {error && <AlertBanner type="error" message={error} />}
      {success && <AlertBanner type="success" message={success} />}
      <EntryFormCard
        title="Yeni Avans"
        employees={employees}
        employeeId={employeeId}
        onEmployeeChange={setEmployeeId}
        fields={[
          { name: 'date', label: 'Tarih', type: 'date' },
          { name: 'amount', label: 'Tutar (₺)', type: 'number', step: '0.01' },
          { name: 'description', label: 'Açıklama', type: 'textarea', required: false },
        ]}
        values={values}
        onChange={(n, v) => setValues((s) => ({ ...s, [n]: v }))}
        onSubmit={handleSubmit}
        loading={loading || empLoading}
      />
      {jobs.length > 0 && (
        <div className={`${cardClass} p-4 sm:p-6 max-w-xl -mt-4 mb-6`}>
          <JobSelectField jobs={jobs} value={jobId} onChange={setJobId} />
        </div>
      )}
    </div>
  );
}
