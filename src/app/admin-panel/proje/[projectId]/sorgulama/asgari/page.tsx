'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import dayjs from 'dayjs';
import { ProjectPageHeader } from '@/components/project/ProjectPageHeader';
import { QueryFilters } from '@/components/project/QueryFilters';
import { RecordsTable } from '@/components/project/RecordsTable';
import { RecordEditActions } from '@/components/project/RecordEditActions';
import { AlertBanner } from '@/components/project/AlertBanner';
import { useProjectEmployees } from '@/hooks/useProjectEmployees';
import { fetchRecords } from '@/lib/project-api';
import { formatMoney, formatDate } from '@/lib/format';

type Record = {
  id: string;
  date: string;
  amount: number;
  description?: string | null;
  employees?: { name: string } | null;
};

export default function AsgariSorgulamaPage() {
  const { projectId } = useParams() as { projectId: string };
  const { employees, error: empError } = useProjectEmployees(projectId);
  const [employeeId, setEmployeeId] = useState('');
  const [month, setMonth] = useState(dayjs().format('YYYY-MM'));
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchRecords(projectId, 'minimum-wages', {
      employeeId: employeeId || undefined,
      month,
    })
      .then((d) => setRecords(d.records ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [projectId, employeeId, month]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <ProjectPageHeader
        title="Asgari Sorgulama"
        description="Asgari ödeme kayıtlarını görüntüleyin, düzenleyin veya silin."
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
          {
            key: 'emp',
            header: 'Personel',
            render: (r) => r.employees?.name ?? '—',
          },
          { key: 'date', header: 'Tarih', render: (r) => formatDate(r.date) },
          { key: 'amount', header: 'Tutar', render: (r) => formatMoney(Number(r.amount)) },
          {
            key: 'desc',
            header: 'Açıklama',
            render: (r) => r.description || '—',
            hideOnMobile: true,
          },
          {
            key: 'actions',
            header: 'İşlem',
            render: (r) => (
              <RecordEditActions
                projectId={projectId}
                recordType="minimum-wages"
                record={r}
                onChanged={load}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
