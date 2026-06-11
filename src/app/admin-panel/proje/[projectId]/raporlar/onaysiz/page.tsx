'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import dayjs from 'dayjs';
import { ProjectPageHeader } from '@/components/project/ProjectPageHeader';
import { QueryFilters } from '@/components/project/QueryFilters';
import { RecordsTable } from '@/components/project/RecordsTable';
import { AlertBanner } from '@/components/project/AlertBanner';
import { useProjectEmployees } from '@/hooks/useProjectEmployees';
import { fetchRecords } from '@/lib/project-api';
import { formatDate } from '@/lib/format';

type Record = {
  id: string;
  date: string;
  amount: number;
  employees?: { name: string } | null;
};

export default function OnaysizRaporPage() {
  const { projectId } = useParams() as { projectId: string };
  const { employees, error: empError } = useProjectEmployees(projectId);
  const [employeeId, setEmployeeId] = useState('');
  const [month, setMonth] = useState(dayjs().format('YYYY-MM'));
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchRecords(projectId, 'work-logs', {
      employeeId: employeeId || undefined,
      month,
      approved: 'false',
    })
      .then((d) => setRecords(d.records ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [projectId, employeeId, month]);

  return (
    <div>
      <ProjectPageHeader
        title="Onaylanmayanlar"
        description="Onay bekleyen yevmiye kayıtları."
      />
      {empError && <AlertBanner type="error" message={empError} />}
      {error && <AlertBanner type="error" message={error} />}
      <QueryFilters
        employees={employees}
        employeeId={employeeId}
        onEmployeeChange={setEmployeeId}
        month={month}
        onMonthChange={setMonth}
      />
      <RecordsTable
        loading={loading}
        rows={records}
        columns={[
          { key: 'emp', header: 'Personel', render: (r) => r.employees?.name ?? '—' },
          { key: 'date', header: 'Tarih', render: (r) => formatDate(r.date) },
          { key: 'amount', header: 'Gün', render: (r) => r.amount },
        ]}
      />
    </div>
  );
}
