'use client';

import { useEffect, useState } from 'react';
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
        <ProjectPageHeader
          title="Personel Listesi"
          description="Projedeki tüm personelleri görüntüleyin."
        />
        <Link href={`/admin-panel/proje/${projectId}/new`} className={btnSecondary}>
          <FiUserPlus className="w-4 h-4" />
          Yeni Personel
        </Link>
      </div>

      {error && <AlertBanner type="error" message={error} />}

      <RecordsTable
        loading={loading}
        rows={employees}
        emptyMessage="Henüz personel eklenmemiş."
        columns={[
          {
            key: 'photo',
            header: 'Fotoğraf',
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
          { key: 'name', header: 'Ad Soyad', render: (r) => r.name },
          {
            key: 'position',
            header: 'Pozisyon',
            render: (r) => r.position || '—',
            hideOnMobile: true,
          },
          {
            key: 'email',
            header: 'E-posta',
            render: (r) => r.email || '—',
            hideOnMobile: true,
          },
          {
            key: 'wage',
            header: 'Yevmiye',
            render: (r) => formatMoney(Number(r.daily_wage)),
          },
          {
            key: 'hire',
            header: 'İşe Giriş',
            render: (r) => (r.hire_date ? formatDate(r.hire_date) : '—'),
            hideOnMobile: true,
          },
          {
            key: 'status',
            header: 'Durum',
            render: (r) => (
              <span
                className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                  r.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {r.is_active ? 'Aktif' : 'Pasif'}
              </span>
            ),
          },
          {
            key: 'actions',
            header: 'İşlem',
            render: (r) => (
              <Link
                href={`/admin-panel/proje/${projectId}/list/${r.id}`}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline"
              >
                <FiEdit2 className="w-3.5 h-3.5" />
                Düzenle
              </Link>
            ),
          },
        ]}
      />
    </div>
  );
}
