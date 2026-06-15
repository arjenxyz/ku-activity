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
import { useProjectJobs } from '@/hooks/useProjectJobs';
import { fetchRecords } from '@/lib/project-api';
import { formatDate } from '@/lib/format';
import { jobNameFromJoin } from '@/lib/job-record-label';
import { approvalStatusLabel, getWorkLogApprovalStatus } from '@/lib/work-log';

type Record = {
  id: string;
  date: string;
  amount: number;
  approved: boolean;
  job_id?: string | null;
  description?: string | null;
  mesai_type?: string | null;
  admin_confirmed_at?: string | null;
  employee_confirmed_at?: string | null;
  employee_disputed_at?: string | null;
  employee_dispute_note?: string | null;
  employees?: { name: string } | null;
  project_jobs?: { name: string } | null;
};

export default function YevmiyeSorgulamaPage() {
  const { projectId } = useParams() as { projectId: string };
  const { employees, error: empError } = useProjectEmployees(projectId);
  const { jobs } = useProjectJobs(projectId);
  const [employeeId, setEmployeeId] = useState('');
  const [month, setMonth] = useState(dayjs().format('YYYY-MM'));
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchRecords(projectId, 'work-logs', {
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
        title="Yevmiye Sorgulama"
        description="Yevmiye kayıtlarını görüntüleyin, iş kalemini düzenleyin veya silin."
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
          { key: 'amount', header: 'Gün', render: (r) => r.amount },
          {
            key: 'job',
            header: 'İş kalemi',
            render: (r) => jobNameFromJoin(r),
            hideOnMobile: true,
          },
          {
            key: 'status',
            header: 'Durum',
            render: (r) => {
              const status = getWorkLogApprovalStatus(r);
              const tone =
                status === 'confirmed'
                  ? 'bg-emerald-50 text-emerald-700'
                  : status === 'disputed'
                    ? 'bg-red-50 text-red-700'
                    : 'bg-amber-50 text-amber-700';
              return (
                <span className={`text-xs px-2 py-0.5 rounded ${tone}`}>
                  {approvalStatusLabel(status)}
                </span>
              );
            },
          },
          {
            key: 'dispute',
            header: 'İtiraz',
            render: (r) =>
              r.employee_dispute_note ? (
                <span
                  className="text-xs text-red-700 max-w-[12rem] truncate block"
                  title={r.employee_dispute_note}
                >
                  {r.employee_dispute_note}
                </span>
              ) : (
                '—'
              ),
            hideOnMobile: true,
          },
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
                recordType="work-logs"
                record={r}
                jobs={jobs}
                showApproved
                onChanged={load}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
