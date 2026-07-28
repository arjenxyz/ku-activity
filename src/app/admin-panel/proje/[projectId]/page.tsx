'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import dayjs from 'dayjs';
import { FiCalendar } from 'react-icons/fi';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { fetchProject } from '@/api/projects';
import { fetchEmployees } from '@/api/employees';
import { ProjectSummaryHero } from '@/components/project/ProjectSummaryHero';
import { ProjectTodayAttendanceCard } from '@/components/project/ProjectTodayAttendanceCard';
import { ProjectEmployeeTable } from '@/components/project/ProjectEmployeeTable';
import { PersonnelOverviewStrip } from '@/components/personnel/PersonnelOverviewStrip';
import { formatMoney } from '@/lib/format';
import type { Employee } from '@/types/adminTypes';
import type { Project } from '@/types/project';
import { adminHref } from '@/lib/demo/demo-paths';

export default function ProjectDetailPage() {
  const strings = useRegistryStrings('app/admin-panel/proje/[projectId]/page');
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname() ?? '';
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
      <div className="px-4 py-16 text-center text-red-600">{strings.invalidProjectUrl}</div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        <p className="text-sm text-slate-500">{strings.loadingData}</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-700">{error || strings.projectNotFound}</p>
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

  const goAttendance = () => {
    router.push(adminHref(pathname, `/admin-panel/proje/${projectId}/yevmiye`));
  };

  return (
    <div className="space-y-4 overflow-x-hidden sm:space-y-5">
      <ProjectSummaryHero
        project={project}
        presentToday={presentToday}
        activeCount={activeCount}
        todayMissing={todayMissing}
        totalPayroll={totalPayroll}
        onOpenAttendance={goAttendance}
      />

      <ProjectTodayAttendanceCard
        project={project}
        projectId={projectId}
        presentCount={presentToday}
        missingCount={todayMissing}
        totalCount={employees.length}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <PersonnelOverviewStrip
          title={strings.stripTitle}
          icon={<FiCalendar className="h-4 w-4" />}
          iconClassName="bg-blue-100 text-blue-600"
          lines={[
            { count: presentToday, label: strings.stripPresent },
            { count: todayMissing, label: strings.stripMissing },
            { count: activeCount, label: strings.stripActive },
            {
              count: totalPayroll,
              label: strings.stripPayroll,
              display: formatMoney(totalPayroll),
            },
          ]}
          onOpen={goAttendance}
        />
      </div>

      <ProjectEmployeeTable
        employees={employees}
        loading={employeesLoading}
        projectId={projectId}
        previewLimit={6}
        onPhotoChange={(employeeId, photoUrl) =>
          setEmployees((prev) =>
            prev.map((e) => (e.id === employeeId ? { ...e, photo_url: photoUrl } : e))
          )
        }
      />
    </div>
  );
}
