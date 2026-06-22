'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { FiRefreshCw } from 'react-icons/fi';

import { fetchProject } from '@/api/projects';
import { fetchEmployees } from '@/api/employees';
import { ProjectPageHeader } from '@/components/project/ProjectPageHeader';
import { ProjectOverviewStats } from '@/components/project/ProjectOverviewStats';
import { ProjectEmployeeTable } from '@/components/project/ProjectEmployeeTable';
import type { Employee, AttendanceStats } from '@/types/adminTypes';
import type { Project } from '@/types/project';
import { useAdminUiMode } from '@/hooks/useAdminUiMode';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Array.isArray(params.projectId) ? params.projectId[0] : params.projectId;

  const [project, setProject] = useState<Project | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({ present: 0, absent: 0, late: 0 });
  const [loading, setLoading] = useState(true);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isSimple } = useAdminUiMode();

  const loadEmployees = useCallback(async () => {
    if (!projectId) return;
    setEmployeesLoading(true);
    try {
      const month = dayjs().format('YYYY-MM');
      const data = await fetchEmployees(projectId, month);
      setEmployees(data.employees);
      setStats(data.attendanceStats);
    } catch (e) {
      console.error(e);
    } finally {
      setEmployeesLoading(false);
    }
  }, [projectId]);

  const loadAll = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const projectData = await fetchProject(projectId);
      if (!projectData) {
        setError('Proje bulunamadı');
        return;
      }
      setProject(projectData);
      await loadEmployees();
    } catch (e) {
      setError('Veriler yüklenirken hata oluştu');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [projectId, loadEmployees]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  if (!projectId) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-red-600">
        Geçersiz proje adresi
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-slate-200 rounded-lg w-48" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-slate-200 rounded-lg" />
            ))}
          </div>
          <div className="h-64 bg-slate-200 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-700 font-medium">{error || 'Proje bulunamadı'}</p>
        <button
          type="button"
          onClick={() => router.push('/admin-panel')}
          className="mt-4 text-sm text-blue-700 hover:underline"
        >
          Proje listesine dön
        </button>
      </div>
    );
  }

  const todayMissing = employees.filter((e) => !e.today_verified).length;
  const totalPayroll = employees.reduce(
    (sum, emp) => sum + emp.daily_wage * (emp.monthly_attendance?.filter((d) => d > 0).length ?? 0),
    0
  );
  const activeCount = project.active_employee_count ?? employees.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <ProjectPageHeader
          title={isSimple ? 'Günlük yoklama' : 'Proje özeti'}
          description={
            isSimple
              ? 'Personel yoklaması ve günlük durum.'
              : 'QR yoklama, personel durumu ve aylık özet.'
          }
        />
        <button
          type="button"
          onClick={() => loadAll()}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 shrink-0"
        >
          <FiRefreshCw className="w-4 h-4" />
          Yenile
        </button>
      </div>

      <ProjectOverviewStats
        employeeCount={employees.length}
        activeCount={activeCount}
        todayMissing={todayMissing}
        totalPayroll={totalPayroll}
        stats={stats}
      />

      <ProjectEmployeeTable
        employees={employees}
        loading={employeesLoading}
        projectId={projectId}
        onPhotoChange={(employeeId, photoUrl) =>
          setEmployees((prev) =>
            prev.map((e) => (e.id === employeeId ? { ...e, photo_url: photoUrl } : e))
          )
        }
      />
    </div>
  );
}
