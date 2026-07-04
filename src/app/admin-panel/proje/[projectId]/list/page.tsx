'use client';


import { useEffect, useState } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { FiEdit2, FiUserPlus } from 'react-icons/fi';
import { ProjectPageHeader } from '@/components/project/ProjectPageHeader';
import { RecordsTable } from '@/components/project/RecordsTable';
import { AlertBanner } from '@/components/project/AlertBanner';
import { btnSecondary } from '@/components/project/ui';
import { EmployeePhotoUpload } from '@/components/employee/EmployeePhotoUpload';
import { fetchProjectEmployees, type ProjectEmployee } from '@/lib/project-api';
import { formatMoney, formatDate } from '@/lib/format';

export default function EmployeeListPage() {

  const strings = useRegistryStrings('app/admin-panel/proje/[projectId]/list/page');
  const { projectId } = useParams() as { projectId: string };
  const [employees, setEmployees] = useState<ProjectEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEmployees = () => {
    setLoading(true);
    fetchProjectEmployees(projectId)
      .then(setEmployees)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const updateEmployeePhoto = (employeeId: string, photoUrl: string | null) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === employeeId ? { ...e, photo_url: photoUrl } : e))
    );
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-2">
        <ProjectPageHeader title={strings.pageTitle} description={strings.pageDescription} />
        <Link href={`/admin-panel/proje/${projectId}/new`} className={btnSecondary}>
          <FiUserPlus className="w-4 h-4" />
          {strings.newEmployeeButton}
        </Link>
      </div>

      {error && <AlertBanner type="error" message={error} />}

      <RecordsTable
        loading={loading}
        rows={employees}
        emptyMessage={strings.emptyMessage}
        columns={[
          {
            key: 'photo',
            header: strings.colPhoto,
            render: (r) => (
              <EmployeePhotoUpload
                projectId={projectId}
                employeeId={r.id}
                name={r.name}
                photoUrl={r.photo_url}
                compact
                onChange={(url) => updateEmployeePhoto(r.id, url)}
              />
            ),
          },
          { key: 'name', header: strings.colName, render: (r) => r.name },
          {
            key: 'position',
            header: strings.colPosition,
            render: (r) => r.position || strings.emptyCell,
            hideOnMobile: true,
          },
          {
            key: 'email',
            header: strings.colEmail,
            render: (r) => r.email || strings.emptyCell,
            hideOnMobile: true,
          },
          {
            key: 'wage',
            header: strings.colWage,
            render: (r) => formatMoney(Number(r.daily_wage)),
          },
          {
            key: 'hire',
            header: strings.colHireDate,
            render: (r) => (r.hire_date ? formatDate(r.hire_date) : strings.emptyCell),
            hideOnMobile: true,
          },
          {
            key: 'status',
            header: strings.colStatus,
            render: (r) => (
              <span
                className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                  r.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {r.is_active ? strings.statusActive : strings.statusInactive}
              </span>
            ),
          },
          {
            key: 'actions',
            header: strings.colActions,
            render: (r) => (
              <Link
                href={`/admin-panel/proje/${projectId}/list/${r.id}`}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline"
              >
                <FiEdit2 className="w-3.5 h-3.5" />
                {strings.editLink}
              </Link>
            ),
          },
        ]}
      />
    </div>
  );
}
