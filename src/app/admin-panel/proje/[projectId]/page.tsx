'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { FiUserPlus, FiFileText, FiFilter, FiRefreshCw } from 'react-icons/fi';

import { fetchProject } from '@/api/projects';
import { fetchEmployees } from '@/api/employees';

import Sidebar from '@/components/ui/Sidebar/Sidebar';
import { StatCard } from '@/components/ui/StatCard';
import type { Employee, AttendanceStats, Project } from '@/types/adminTypes';
import { DATE_FORMATS, formatDate } from '@/utils/dateUtils';

export default function ProjectDashboard() {
  const params = useParams();
  const router = useRouter();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AttendanceStats>({ present: 0, absent: 0, late: 0 });

  const projectIdRaw = params.projectId;
  const projectId = Array.isArray(projectIdRaw) ? projectIdRaw[0] : projectIdRaw;

  const initializeData = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const selectedMonth = dayjs().format('YYYY-MM');
      const [projectData, employeesData] = await Promise.all([
        fetchProject(projectId),
        fetchEmployees(projectId, selectedMonth)
      ]);
      if (projectData) setProject(projectData);
      if (employeesData) {
        setEmployees(employeesData.employees);
        setStats(employeesData.attendanceStats);
      }
    } catch (error) {
      console.error('Proje yükleme hatası:', error);
      router.push('/admin-panel/');
    } finally {
      setLoading(false);
    }
  }, [projectId, router]);

  useEffect(() => {
    if (projectId) {
      initializeData();
    }
  }, [initializeData, projectId]);

  if (!projectId) {
    return <div className="p-8 text-center text-red-600">Geçersiz proje ID</div>;
  }

  if (loading) {
    return <div className="p-8 text-center">Yükleniyor...</div>;
  }

  if (!project) {
    return <div className="p-8 text-center">Proje yükleniyor...</div>;
  }

  const totalPayroll = employees.reduce(
    (acc, emp) => acc + emp.daily_wage * (emp.total_days || 0),
    0
  );

  const todayMissing = employees.filter(emp => !emp.today_verified).length;

  return (
    <div className="relative min-h-screen bg-gray-50 p-4 md:p-8">
      <Sidebar />
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-gray-600">{formatDate(dayjs().toString(), DATE_FORMATS.DAY_MONTH_YEAR)}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Toplam Personel" value={employees.length} icon={<FiUserPlus />} color="bg-blue-100 text-blue-600" />
          <StatCard title="Bugün Onaysız" value={todayMissing} icon={<FiFileText />} color="bg-red-100 text-red-600" />
          <StatCard title="Toplam Maaş" value={`₺${totalPayroll.toLocaleString()}`} icon={<FiFilter />} color="bg-green-100 text-green-600" />
          <StatCard title="Aylık Katılım" value={`${stats.present}/${stats.present + stats.absent}`} icon={<FiRefreshCw />} color="bg-purple-100 text-purple-600" />
        </div>
      </div>
    </div>
  );
}
