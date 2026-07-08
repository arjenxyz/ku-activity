'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { useParams, useRouter } from 'next/navigation';
import dayjs from 'dayjs';

import { fetchProject } from '@/api/projects';
import { fetchEmployees } from '@/api/employees';
import { ProjectLegalDossierDownloadButton } from '@/components/admin/ProjectLegalDossierDownloadButton';
import { ProjectSummaryHero } from '@/components/project/ProjectSummaryHero';
import { ProjectTodayAttendanceCard } from '@/components/project/ProjectTodayAttendanceCard';
import { ProjectEmployeeTable } from '@/components/project/ProjectEmployeeTable';
import { PersonnelOverviewStrip } from '@/components/personnel/PersonnelOverviewStrip';
import { FiUsers } from 'react-icons/fi';
import type { Employee } from '@/types/adminTypes';
import type { Project } from '@/types/project';
import { formatMoney } from '@/lib/format';

export default function ProjectDetailPage() {
  const strings = useRegistryStrings('app/admin-panel/proje/[projectId]/page');
  const statsStrings = useRegistryStrings('components/project/ProjectOverviewStats');
  const params = useParams();
  const router = useRouter();
  const projectId = Array.isArray(params.projectId) ? params.projectId[0] : params.projectId;

  const [project, setProject] = useState<Project | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEmployees = useCallback(async () => {
    if (!projectId) return;
    setEmployeesLoading(true);
    try {
      const month = dayjs().format('YYYY-MM');
      const data = await fetchEmployees(projectId, month);
      setEmployees(data.employees);
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
        setError(strings.projectNotFound);
        return;
      }
      setProject(projectData);
      await loadEmployees();
    } catch (e) {
      setError(strings.loadError);
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [projectId, loadEmployees, strings.projectNotFound, strings.loadError]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  if (!projectId) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center text-red-600">
        {strings.invalidProjectUrl}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-5">
        <div className="h-52 animate-pulse rounded-2xl bg-slate-200 sm:rounded-3xl" />
        <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-28 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <p className="font-medium text-slate-700">{error || strings.projectNotFound}</p>
        <button
          type="button"
          onClick={() => router.push('/admin-panel')}
          className="mt-4 text-sm text-blue-700 hover:underline"
        >
          {strings.backToProjectList}
        </button>
      </div>
    );
  }

  const todayMissing = employees.filter((e) => !e.today_verified).length;
  const presentToday = employees.filter((e) => e.today_verified).length;
  const totalPayroll = employees.reduce(
    (sum, emp) => sum + emp.daily_wage * (emp.monthly_attendance?.filter((d) => d > 0).length ?? 0),
    0
  );
  const activeCount = project.active_employee_count ?? employees.length;

  return (
    <div className="mx-auto max-w-lg space-y-4 overflow-x-hidden sm:max-w-2xl sm:space-y-5">
      <ProjectSummaryHero
        project={project}
        presentToday={presentToday}
        activeCount={activeCount}
        todayMissing={todayMissing}
        totalPayroll={totalPayroll}
        projectId={projectId}
        onRefresh={() => void loadAll()}
        dossierSlot={
          <ProjectLegalDossierDownloadButton
            projectId={projectId}
            projectName={project.name}
            compact
            className="[&_button]:!rounded-xl [&_button]:!bg-white/15 [&_button]:!px-3.5 [&_button]:!py-2 [&_button]:!text-xs [&_button]:!font-semibold [&_button]:!ring-1 [&_button]:!ring-white/20 [&_button]:hover:!bg-white/25"
          />
        }
      />

      <ProjectTodayAttendanceCard
        projectId={projectId}
        presentCount={presentToday}
        missingCount={todayMissing}
        totalCount={employees.length}
      />

      <PersonnelOverviewStrip
        title={strings.stripTitle}
        icon={<FiUsers className="h-5 w-5" />}
        iconClassName="bg-blue-100 text-blue-600"
        lines={[
          { count: employees.length, label: statsStrings.stats.employees },
          { count: activeCount, label: statsStrings.stats.active },
          { count: todayMissing, label: statsStrings.stats.missing },
          {
            count: totalPayroll,
            label: statsStrings.stats.payroll,
            display: formatMoney(totalPayroll),
          },
        ]}
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
