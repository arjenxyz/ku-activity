'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { FiUserPlus, FiUserCheck, FiFileText, FiFilter, FiRefreshCw, FiSearch, FiCalendar } from 'react-icons/fi';

// API Hooks
import { fetchProject } from '@/api/projects';
import { fetchEmployees } from '@/api/employees';
import { fetchWorkLogs, deleteWorkLog } from '@/api/workLogs';
import { fetchDeductions, deleteDeduction } from '@/api/deductions';

// Components
import { ProjectSettingsModal } from '@/components/modals/ProjectSettingsModal';
import { AddWorkLogModal } from '@/components/modals/AddWorkLogModal';
import { EmployeeTable } from '@/components/tables/EmployeeTable';
import { DeductionTable } from '@/components/tables/DeductionTable';
import { StatCard } from '@/components/ui/StatCard';
import { ActionButton } from '@/components/ui/ActionButton';
import { MobileMenu } from '@/components/ui/MobileMenu';

// Types & Utils
import type { Employee, AttendanceStats, Project, WorkLog, Deduction } from '@/types/adminTypes';
import { DATE_FORMATS, formatDate, projectDateHelpers } from '@/utils/dateUtils';

export default function ProjectDashboard() {
  const params = useParams();
  const router = useRouter();

  // Proje ID'sini güvenli şekilde alma
  const projectIdRaw = params.projectId;
  const projectId = Array.isArray(projectIdRaw) ? projectIdRaw[0] : projectIdRaw;

  // State Management
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [deductions, setDeductions] = useState<Deduction[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AttendanceStats>({ present: 0, absent: 0, late: 0 });

  // UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(projectDateHelpers.getCurrentMonth());
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addWorkLogOpen, setAddWorkLogOpen] = useState(false);

  // Proje ID kontrolü
  if (!projectId) {
    return <div className="p-8 text-center text-red-600">Geçersiz proje ID</div>;
  }

  // Veri yükleme ve filtreleme
  const initializeData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [projectData, employeesData, logsData, deductionsData] = await Promise.all([
        fetchProject(projectId),
        fetchEmployees(projectId, selectedMonth),
        fetchWorkLogs(projectId),
        fetchDeductions(projectId)
      ]);

      if (projectData) setProject(projectData);
      if (employeesData) {
        setEmployees(employeesData.employees);
        setStats(employeesData.attendanceStats);
        setFilteredEmployees(employeesData.employees);
      }
      if (logsData) setLogs(logsData);
      if (deductionsData) setDeductions(deductionsData);
    } catch (error) {
      console.error('Data initialization error:', error);
      router.push('/admin-panel/proje');
    } finally {
      setLoading(false);
    }
  }, [projectId, selectedMonth, router]);

  // Filtre uygulama
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

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // İşlevsel güncellemeler
  const handleMonthChange = useCallback((newMonth: string) => {
    setSelectedMonth(newMonth);
    initializeData();
  }, [initializeData]);

  const handleDeleteLog = useCallback(async (logId: string) => {
    await deleteWorkLog(logId);
    initializeData();
  }, [initializeData]);

  const handleDeleteDeduction = useCallback(async (deductionId: string) => {
    await deleteDeduction(deductionId);
    initializeData();
  }, [initializeData]);

  const handleDeleteProject = useCallback(async () => {
    try {
      // await deleteProject(projectId); // API çağrısı aktif edilmeli
      router.push('/admin-panel/proje');
    } catch (error) {
      console.error('Proje silme hatası:', error);
    }
  }, [projectId, router]);

  // Hesaplamalar
  const totalPayroll = useCallback(() => {
    return filteredEmployees.reduce(
      (acc, emp) => acc + emp.daily_wage * (emp.total_days || 0),
      0
    );
  }, [filteredEmployees]);

  const todayMissing = useCallback(() => {
    return filteredEmployees.filter(emp => !emp.today_verified).length;
  }, [filteredEmployees]);

  // Action Buttons
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

  if (!project) return <div className="p-8 text-center">Proje yükleniyor...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Mobile Menu */}
        <MobileMenu
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          buttons={actionButtons}
        />

        {/* Action Buttons */}
        <div className="hidden md:flex flex-wrap gap-3">
          {actionButtons.map(btn => (
            <ActionButton key={btn.text} {...btn} />
          ))}
        </div>

        {/* Header Section */}
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
          
          {/* Month Picker */}
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Toplam Personel"
            value={filteredEmployees.length}
            icon={<FiUserPlus />}
            color="bg-blue-100 text-blue-600"
          />
          <StatCard
            title="Bugün Onaysız"
            value={todayMissing()}
            icon={<FiFileText />}
            color="bg-red-100 text-red-600"
          />
          <StatCard
            title="Toplam Maaş"
            value={`₺${totalPayroll().toLocaleString()}`}
            icon={<FiFilter />}
            color="bg-green-100 text-green-600"
          />
          <StatCard
            title="Aylık Katılım"
            value={`${stats.present}/${stats.present + stats.absent}`}
            icon={<FiRefreshCw />}
            color="bg-purple-100 text-purple-600"
          />
        </div>

        {/* Filters */}
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

        {/* Tables */}
        <EmployeeTable
          employees={filteredEmployees}
          loading={loading}
          onVerify={() => {}}
          onYevmiyeOpen={() => setAddWorkLogOpen(true)}
        />

        <DeductionTable
          deductions={deductions}
          loading={loading}
          onDelete={handleDeleteDeduction}
        />

        {/* Modals */}
        <ProjectSettingsModal
          project={project}
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onUpdate={(updatedProject: Project) => setProject(updatedProject)}
          onDelete={handleDeleteProject}
        />

        <AddWorkLogModal
          isOpen={addWorkLogOpen}
          onClose={() => setAddWorkLogOpen(false)}
          employees={employees}
          onSubmit={initializeData}
          projectId={projectId}
        />
      </div>
    </div>
  );
}
