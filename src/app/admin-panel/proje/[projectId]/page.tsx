// src/app/admin-panel/projects/[projectId]/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { FiUserPlus, FiFileText, FiFilter, FiRefreshCw, FiSettings as FiSettingsIcon } from 'react-icons/fi'; // FiSettingsIcon'ı geri ekledim eğer kullanmak istersen

import { fetchProject, deleteProject } from '@/api/projects'; // deleteProject import'ını ekledim
import { fetchEmployees } from '@/api/employees';

import { ProjectSettingsModal } from '@/components/modals/ProjectSettingsModal'; // ProjectSettingsModal'ı import et!
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // isSettingsOpen olarak kalsın

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

  // Yüklenme durumunda sadece basit bir "Yükleniyor..." göster
  if (loading) {
    return <div className="p-8 text-center">Yükleniyor...</div>;
  }

  // Proje yüklenmediyse hata göster
  if (!project) {
    return <div className="p-8 text-center">Proje bulunamadı veya yüklenirken bir hata oluştu.</div>;
  }

  const totalPayroll = employees.reduce(
    (acc, emp) => acc + emp.daily_wage * (emp.total_days || 0),
    0
  );

  const todayMissing = employees.filter(emp => !emp.today_verified).length;

  // onDelete fonksiyonunu ProjectSettingsModal'ın beklediği gibi tanımla
  const onDelete = async () => {
    if (!projectId) return;
    try {
      // deleteProject fonksiyonunu çağırıyoruz
      const { error } = await deleteProject(projectId);
      if (!error) {
        // Silme başarılı olursa projeler sayfasına yönlendir
        router.replace('/admin-panel/');
      } else {
        console.error('Proje silme hatası:', error);
        alert('Proje silinirken hata oluştu.');
      }
    } catch (error) {
      console.error('Proje silme hatası:', error);
      alert('Proje silinirken hata oluştu.');
    }
  };


  return (
    <div className="relative min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Sidebar'a setIsSettingsOpen prop'unu geçirin */}
      <Sidebar setSettingsOpen={setIsSettingsOpen} />

      {/* isSettingsOpen durumuna göre ProjectSettingsModal'ı gösterin */}
      {project && ( // project null değilse modalı render etmeliyiz
        <ProjectSettingsModal
          project={project}
          isOpen={isSettingsOpen} // isSettingsOpen state'ine bağlı
          onClose={() => setIsSettingsOpen(false)} // Modalı kapatmak için setter'ı kullan
          onUpdate={setProject} // Project state'ini güncellemek için setter'ı kullan
          onDelete={onDelete} // Silme işlemini yöneten fonksiyonu ver
        />
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {project.name}
            {/* Bu butonu kaldırabilirsin veya farklı bir işlev için kullanabilirsin,
                çünkü artık Sidebar üzerinden açılıyor. */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="ml-2 p-2 hover:bg-gray-100 rounded-full"
            >
              <FiSettingsIcon />
            </button>
          </h1>
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
