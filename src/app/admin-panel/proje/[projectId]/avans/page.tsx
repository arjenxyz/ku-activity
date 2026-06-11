'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import dayjs from 'dayjs';
import { ProjectPageHeader } from '@/components/project/ProjectPageHeader';
import { EntryFormCard } from '@/components/project/EntryFormCard';
import { AlertBanner } from '@/components/project/AlertBanner';
import { useProjectEmployees } from '@/hooks/useProjectEmployees';
import { postDeduction } from '@/lib/project-api';

export default function AvansPage() {
  const { projectId } = useParams() as { projectId: string };
  const { employees, loading: empLoading, error: empError } = useProjectEmployees(projectId);
  const [employeeId, setEmployeeId] = useState('');
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
      });
      setSuccess('Avans kaydı oluşturuldu.');
      setValues({ date: dayjs().format('YYYY-MM-DD'), amount: '', description: '' });
      setEmployeeId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <ProjectPageHeader title="Avans Ekle" description="Personele avans kaydı girin." />
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
    </div>
  );
}
