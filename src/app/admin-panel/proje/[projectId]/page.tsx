'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { FiUserPlus, FiUserCheck, FiFileText, FiFilter, FiRefreshCw, FiSearch, FiCalendar } from 'react-icons/fi';

import { fetchProject } from '@/api/projects';
import { fetchEmployees } from '@/api/employees';
import { fetchDeductions, deleteDeduction } from '@/api/deductions';

import { ProjectSettingsModal } from '@/components/modals/ProjectSettingsModal';
import { AddWorkLogModal } from '@/components/modals/AddWorkLogModal';
import { EmployeeTable } from '@/components/tables/EmployeeTable';
import { DeductionTable } from '@/components/tables/DeductionTable';
import { StatCard } from '@/components/ui/StatCard';
import { ActionButton } from '@/components/ui/ActionButton';
import { MobileMenu } from '@/components/ui/MobileMenu';

import type { Employee, AttendanceStats, Project, Deduction } from '@/types/adminTypes';
import { DATE_FORMATS, formatDate, projectDateHelpers } from '@/utils/dateUtils';

export default function ProjectDashboard() {
  const params = useParams();
  const router = useRouter();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [deductions, setDeductions] = useState<Deduction[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AttendanceStats>({ present: 0, absent: 0, late: 0 });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(projectDateHelpers.getCurrentMonth());
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addWorkLogOpen, setAddWorkLogOpen] = useState(false);

  const projectIdRaw = params.projectId;
  const projectId = Array.isArray(projectIdRaw) ? projectIdRaw[0] : projectIdRaw;

  const initializeData = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const [projectData, employeesData, deductionsData] = await Promise.all([
        fetchProject(projectId),
        fetchEmployees(projectId, selectedMonth),
        fetchDeductions(projectId)
      ]);
      if (projectData) setProject(projectData);
      if (employeesData) {
        setEmployees(employeesData.employees);
        setStats(employeesData.attendanceStats);
        setFilteredEmployees(employeesData.employees);
      }
      if (deductionsData) setDeductions(deductionsData);
    } catch (error) {
      console.error('Data initialization error:', error);
      router.push('/admin-panel/proje');
    } finally {
      setLoading(false);
    }
  }, [projectId, selectedMonth, router]);

  const applyFilters = useCallback(() => {
    let filtered = employees;
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(emp => emp.position === departmentFilter);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(emp =>
        emp.name.toLowerCase().includes(term) ||
        emp.email.toLowerCase().includes(term) ||
        emp.phone.toLowerCase().includes(term)
      );
    }
    setFilteredEmployees(filtered);
  }, [employees, departmentFilter, searchTerm]);

  const handleMonthChange = useCallback((newMonth: string) => {
    setSelectedMonth(newMonth);
  }, []);

  const handleDeleteDeduction = useCallback(async (deductionId: string) => {
    await deleteDeduction(deductionId);
    initializeData();
  }, [initializeData]);

  const handleDeleteProject = useCallback(async () => {
    try {
      // await deleteProject(projectId);
      router.push('/admin-panel/proje');
    } catch (error) {
      console.error('Proje silme hatası:', error);
    }
  }, [router]);

  // YENİ: onVerify fonksiyonu eklendi
  const handleVerifyEmployee = (id: string) => {
    // Burada personelin doğrulama işlemini gerçekleştir.
    // Örneğin bir API çağrısı yapabilir, state güncelleyebilirsin.
    console.log("Doğrulanan personel id:", id);
  };

  useEffect(() => {
    if (projectId) {
      initializeData();
    }
  }, [initializeData, projectId]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  if (!projectId) {
    return <div className="p-8 text-center text-red-600">Geçersiz proje ID</div>;
  }

  if (!project) {
    return <div className="p-8 text-center">Proje yükleniyor...</div>;
  }

  const actionButtons = [
    {
      icon: <FiUserPlus />,
      text: 'Yeni Personel Ekle',
      onClick: () => router.push(`/admin-panel/proje/${projectId}/new`),
      color: 'bg-indigo-600 hover:bg-indigo-700 text-white transition-colors',
    },
    {
      icon: <FiFileText />,
      text: 'PDF Raporu Oluştur',
      onClick: () => router.push(`/admin-panel/proje/${projectId}/report`),
      color: 'bg-green-600 hover:bg-green-700 text-white transition-colors',
    },
    {
      icon: <FiUserCheck />,
      text: 'Kişisel Sorgulama',
      onClick: () => router.push(`/admin-panel/arjen/sorgulama/${projectId}/`),
      color: 'bg-blue-600 hover:bg-blue-700 text-white transition-colors',
    },
    {
      icon: <FiFilter />,
      text: 'Detaylı Filtreleme',
      onClick: () => setMobileMenuOpen(true),
      color: 'bg-purple-600 hover:bg-purple-700 text-white transition-colors',
    }
  ];

  const totalPayroll = filteredEmployees.reduce(
    (acc, emp) => acc + emp.daily_wage * (emp.total_days || 0),
    0
  );

  const todayMissing = filteredEmployees.filter(emp => !emp.today_verified).length;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <MobileMenu
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          buttons={actionButtons}
        />
        <div className="hidden md:flex flex-wrap gap-3">
          {actionButtons.map(btn => (
            <ActionButton key={btn.text} {...btn} />
          ))}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {project.name}
              <button 
                onClick={() => setSettingsOpen(true)}
                className="ml-2 p-2 hover:bg-gray-100 rounded-full"
              >
                <FiFilter />
              </button>
            </h1>
            <p className="text-gray-600">{formatDate(dayjs().toString(), DATE_FORMATS.DAY_MONTH_YEAR)}</p>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-2 border rounded-lg">
            <FiCalendar className="text-gray-400" />
            <input
              type="month"
              className="focus:outline-none"
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Toplam Personel" value={filteredEmployees.length} icon={<FiUserPlus />} color="bg-blue-100 text-blue-600" />
          <StatCard title="Bugün Onaysız" value={todayMissing} icon={<FiFileText />} color="bg-red-100 text-red-600" />
          <StatCard title="Toplam Maaş" value={`₺${totalPayroll.toLocaleString()}`} icon={<FiFilter />} color="bg-green-100 text-green-600" />
          <StatCard title="Aylık Katılım" value={`${stats.present}/${stats.present + stats.absent}`} icon={<FiRefreshCw />} color="bg-purple-100 text-purple-600" />
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Personel ara..."
              className="pl-10 pr-4 py-2 border rounded-lg w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="border rounded-lg px-3 py-2"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="all">Tüm Departmanlar</option>
            {[...new Set(employees.map(e => e.position))].map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
        <EmployeeTable
          employees={filteredEmployees}
          loading={loading}
          onYevmiyeOpen={() => setAddWorkLogOpen(true)}
          onVerify={handleVerifyEmployee} // <-- EKLENDİ!
        />
        <DeductionTable deductions={deductions} loading={loading} onDelete={handleDeleteDeduction} />
        <ProjectSettingsModal project={project} isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} onUpdate={setProject} onDelete={handleDeleteProject} />
        <AddWorkLogModal isOpen={addWorkLogOpen} onClose={() => setAddWorkLogOpen(false)} employees={employees} onSubmit={initializeData} projectId={projectId} />
      </div>
    </div>
  );
}
