'use client';


import { useState, useEffect } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { useParams, useSearchParams } from 'next/navigation';
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

  const strings = useRegistryStrings('app/admin-panel/proje/[projectId]/avans/page');
  const { projectId } = useParams() as { projectId: string };
  const searchParams = useSearchParams();
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
      setError(strings.employeeAmountRequired);
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
      setSuccess(strings.successCreated);
      setValues({ date: dayjs().format('YYYY-MM-DD'), amount: '', description: '' });
      setEmployeeId('');
      setJobId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.saveFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <ProjectPageHeader title={strings.pageTitle} description={strings.pageDescription} />
      {empError && <AlertBanner type="error" message={empError} />}
      {error && <AlertBanner type="error" message={error} />}
      {success && <AlertBanner type="success" message={success} />}
      <EntryFormCard
        title={strings.formTitle}
        employees={employees}
        employeeId={employeeId}
        onEmployeeChange={setEmployeeId}
        fields={[
          { name: 'date', label: strings.labelDate, type: 'date' },
          { name: 'amount', label: strings.labelAmount, type: 'number', step: '0.01' },
          { name: 'description', label: strings.labelDescription, type: 'textarea', required: false },
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
