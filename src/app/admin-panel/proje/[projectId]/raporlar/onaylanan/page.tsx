'use client';

import strings from '@json/src/app/admin-panel/proje/[projectId]/raporlar/onaylanan/page.json';
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

export default function OnaylananRaporPage() {
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
      approved: 'true',
    })
      .then((d) => setRecords(d.records ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [projectId, employeeId, month]);

  return (
    <div>
      <ProjectPageHeader title={strings.pageTitle} description={strings.pageDescription} />
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
          { key: 'emp', header: strings.colEmployee, render: (r) => r.employees?.name ?? strings.emptyCell },
          { key: 'date', header: strings.colDate, render: (r) => formatDate(r.date) },
          { key: 'amount', header: strings.colDays, render: (r) => r.amount },
        ]}
      />
    </div>
  );
}
