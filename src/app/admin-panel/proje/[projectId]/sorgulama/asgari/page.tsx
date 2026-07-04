'use client';


import { formatString } from '@/lib/strings/format';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
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

  const strings = useRegistryStrings('app/admin-panel/proje/[projectId]/sorgulama/asgari/page');
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
          {
            key: 'emp',
            header: strings.colEmployee,
            render: (r) => r.employees?.name ?? strings.emptyCell,
          },
          { key: 'date', header: strings.colDate, render: (r) => formatDate(r.date) },
          { key: 'amount', header: strings.colAmount, render: (r) => formatMoney(Number(r.amount)) },
          {
            key: 'desc',
            header: strings.colDescription,
            render: (r) => r.description || strings.emptyCell,
            hideOnMobile: true,
          },
          {
            key: 'actions',
            header: strings.colActions,
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

      {records.length > 0 && (
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 text-right font-semibold">
          {formatString(strings.total, {
            amount: formatMoney(records.reduce((s, r) => s + Number(r.amount), 0)),
          })}
        </p>
      )}
    </div>
  );
}
