'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { FiRefreshCw } from 'react-icons/fi';

import { fetchProject } from '@/api/projects';
import { confirmAdminAttendance, fetchEmployees } from '@/api/employees';
import { AdminAttendanceModal } from '@/components/admin/AdminAttendanceModal';
import { ProjectSettingsModal } from '@/components/modals/ProjectSettingsModal';
import type { MesaiType } from '@/lib/work-log';
import { ProjectDetailHeader } from '@/components/project/ProjectDetailHeader';
import { ProjectOverviewStats } from '@/components/project/ProjectOverviewStats';
import { ProjectEmployeeTable } from '@/components/project/ProjectEmployeeTable';
import { AlertBanner } from '@/components/project/AlertBanner';
import { fetchRecords } from '@/lib/project-api';
import type { Employee, AttendanceStats } from '@/types/adminTypes';
import type { Project } from '@/types/project';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Array.isArray(params.projectId) ? params.projectId[0] : params.projectId;

  const [project, setProject] = useState<Project | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({ present: 0, absent: 0, late: 0 });
  const [loading, setLoading] = useState(true);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [attendanceTarget, setAttendanceTarget] = useState<{ id: string; name: string } | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDisputeCount, setOpenDisputeCount] = useState(0);

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
      const disputed = await fetchRecords(projectId, 'work-logs', { disputed: 'true' });
      setOpenDisputeCount((disputed.records ?? []).length);
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

  const handleVerifyClick = (employeeId: string, employeeName: string) => {
    setAttendanceTarget({ id: employeeId, name: employeeName });
  };

  const handleAttendanceSubmit = async (data: {
    amount: number;
    mesaiType: MesaiType;
    description: string;
  }) => {
    if (!projectId || !attendanceTarget) return;
    setVerifyingId(attendanceTarget.id);
    const { error: verifyError } = await confirmAdminAttendance({
      projectId,
      employeeId: attendanceTarget.id,
      amount: data.amount,
      mesaiType: data.mesaiType,
      description: data.description || undefined,
    });
    setVerifyingId(null);
    if (verifyError) {
      alert('Onay kaydedilemedi: ' + verifyError.message);
      return;
    }
    setAttendanceTarget(null);
    await loadEmployees();
  };

  const handleDelete = async () => {
    router.replace('/admin-panel');
  };

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
          <div className="h-32 bg-slate-200 rounded-lg" />
          <div className="grid grid-cols-4 gap-4">
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
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => loadAll()}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <FiRefreshCw className="w-4 h-4" />
          Yenile
        </button>
      </div>

      <ProjectDetailHeader project={project} onSettings={() => setIsSettingsOpen(true)} />

      {openDisputeCount > 0 && (
        <div className="space-y-2">
          <AlertBanner
            type="warning"
            message={`${openDisputeCount} personel itirazı açık. Kayıtları düzeltip personelin tekrar onaylamasını sağlayın.`}
          />
          <a
            href={`/admin-panel/proje/${projectId}/itirazlar`}
            className="inline-flex text-sm font-medium text-amber-900 hover:underline"
          >
            Personel İtirazları sayfasına git →
          </a>
        </div>
      )}

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
        onVerify={handleVerifyClick}
        verifyingId={verifyingId}
        onPhotoChange={(employeeId, photoUrl) =>
          setEmployees((prev) =>
            prev.map((e) => (e.id === employeeId ? { ...e, photo_url: photoUrl } : e))
          )
        }
      />

      <AdminAttendanceModal
        employeeName={attendanceTarget?.name ?? ''}
        isOpen={Boolean(attendanceTarget)}
        loading={Boolean(verifyingId)}
        onClose={() => setAttendanceTarget(null)}
        onSubmit={handleAttendanceSubmit}
      />

      <ProjectSettingsModal
        project={project}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onUpdate={setProject}
        onDelete={handleDelete}
      />
    </div>
  );
}
