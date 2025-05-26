'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import {
  FiUserPlus, FiFileText, FiFilter, FiRefreshCw, FiSearch,
  FiCalendar, FiDollarSign, FiCheckCircle, FiXCircle, FiTrash2, FiList, FiMenu, FiCreditCard, FiUserCheck, FiX, FiSettings
} from 'react-icons/fi';

dayjs.extend(advancedFormat);
dayjs.extend(customParseFormat);

type Employee = {
  id: string;
  name: string;
  email: string;
  phone: string;
  daily_wage: number;
  position: string;
  hire_date: string;
  total_days?: number;
  today_verified?: boolean;
  monthly_attendance?: number[];
};

type AttendanceStats = {
  present: number;
  absent: number;
  late: number;
};

type WorkLog = {
  id: string;
  employee_id: string;
  employee: { id: string; name: string } | null;
  date: string;
  amount: number;
  description: string | null;
};

type Deduction = {
  id: string;
  employee_id: string;
  employee: { id: string; name: string } | null;
  date: string;
  type: string;
  amount: number;
  description: string | null;
};

type Project = {
  id: string;
  name: string;
  description?: string;
};

export default function AdminDashboard() {
  const { projectId } = useParams();
  const router = useRouter();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'));
  const [stats, setStats] = useState<AttendanceStats>({ present: 0, absent: 0, late: 0 });
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [departments, setDepartments] = useState<string[]>([]);
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [deductions, setDeductions] = useState<Deduction[]>([]);
  const [deductionsLoading, setDeductionsLoading] = useState(true);

  // Project info & settings modal
  const [project, setProject] = useState<Project | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Hamburger menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Eylem butonları
  const actionButtons = [
    {
      icon: <FiUserPlus />,
      text: 'Yeni Personel Ekle',
      onClick: () => router.push(`/admin-panel/proje/${projectId}/new`),
      color: 'bg-indigo-600 hover:bg-indigo-700',
    },
    {
      icon: <FiFileText />,
      text: 'PDF Raporu Oluştur',
      onClick: () => router.push('/admin-panel/pdf'),
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      icon: <FiFilter />,
      text: 'Detaylı Raporlar',
      onClick: () => router.push('/admin-panel/reports'),
      color: 'bg-purple-600 hover:bg-purple-700',
    },
    {
      icon: <FiList />,
      text: 'Yevmiye Defteri',
      onClick: () => router.push('/admin-panel/arjen/yevmiye'), 
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      icon: <FiCreditCard />,
      text: 'Avans Defteri',
      onClick: () => router.push('/admin-panel/arjen/avans'),
      color: 'bg-amber-500 hover:bg-amber-600',
    },
    {
      icon: <FiUserCheck />,
      text: 'Kişisel Sorgulama',
      onClick: () => router.push(`/admin-panel/arjen/sorgulama/${projectId}/`),
      color: 'bg-gray-700 hover:bg-gray-800',
    },
    {
      icon: <FiSettings />,
      text: 'Proje Ayarları',
      onClick: () => setSettingsOpen(true),
      color: 'bg-gray-300 hover:bg-gray-400 text-gray-800',
    },
  ];

  // Proje bilgisini getir
  const fetchProject = useCallback(async () => {
    if (!projectId) return;
    const { data } = await supabase.from('projects').select('*').eq('id', projectId).single();
    if (data) {
      setProject(data);
      setEditName(data.name || '');
      setEditDescription(data.description || '');
    }
  }, [projectId]);

  // Çalışan, istatistik ve departman çekme
  const fetchEmployees = useCallback(async () => {
    setLoading(true);

    if (!projectId) {
      setEmployees([]);
      setFilteredEmployees([]);
      setLoading(false);
      return;
    }

    try {
      const { data: deptData } = await supabase
        .from('employees')
        .select('position')
        .eq('project_id', projectId)
        .neq('position', null);

      const uniqueDepts = [...new Set(deptData?.map(d => d.position).filter(Boolean))] as string[];
      setDepartments(uniqueDepts);

      const { data: employeesData } = await supabase
        .from('employees')
        .select('*')
        .eq('project_id', projectId);

      const monthStart = dayjs(selectedMonth).startOf('month').format('YYYY-MM-DD');
      const monthEnd = dayjs(selectedMonth).endOf('month').format('YYYY-MM-DD');

      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('*')
        .gte('date', monthStart)
        .lte('date', monthEnd);

      const presentCount = attendanceData?.filter(a => a.status === 'present').length || 0;
      const absentCount = attendanceData?.filter(a => a.status === 'absent').length || 0;
      const lateCount = attendanceData?.filter(a => a.status === 'late').length || 0;

      setStats({
        present: presentCount,
        absent: absentCount,
        late: lateCount,
      });

      const enriched = await Promise.all(
        employeesData?.map(async (emp) => {
          const { data: workedDays } = await supabase
            .from('attendance')
            .select('date,status')
            .eq('employee_id', emp.id)
            .gte('date', monthStart)
            .lte('date', monthEnd);

          const today = dayjs().format('YYYY-MM-DD');
          const isTodayVerified = attendanceData?.some(
            (a) => a.employee_id === emp.id && a.date === today && a.status === 'present'
          );

          const daysInMonth = dayjs(selectedMonth).daysInMonth();
          const monthlyAttendance = Array(daysInMonth).fill(0);

          workedDays?.forEach(day => {
            const dayIndex = dayjs(day.date).date() - 1;
            monthlyAttendance[dayIndex] = day.status === 'present' ? 1 :
              day.status === 'late' ? 0.5 : 0;
          });

          return {
            ...emp,
            total_days: workedDays?.filter(d => d.status === 'present').length || 0,
            today_verified: isTodayVerified,
            monthly_attendance: monthlyAttendance,
          };
        }) || []
      );

      setEmployees(enriched);
      setFilteredEmployees(enriched);

    } catch (error: any) {
      setEmployees([]);
      setFilteredEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, projectId]);

  // Yevmiye kayıtları
  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    if (!projectId) {
      setLogs([]);
      setLogsLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('work_logs')
      .select('id, employee_id, date, amount, description, employee:employee_id(id, name)')
      .eq('project_id', projectId)
      .order('date', { ascending: false });
    if (!error) {
      const formatted = (data || []).map((d: any) => ({
        ...d,
        employee: Array.isArray(d.employee) ? d.employee[0] || null : d.employee || null,
      }));
      setLogs(formatted);
    }
    setLogsLoading(false);
  }, [projectId]);

  // Avans/kesinti kayıtları
  const fetchDeductions = useCallback(async () => {
    setDeductionsLoading(true);
    if (!projectId) {
      setDeductions([]);
      setDeductionsLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('deductions')
      .select('id, employee_id, date, type, amount, description, employee:employee_id(id, name)')
      .eq('project_id', projectId)
      .order('date', { ascending: false });
    if (!error) {
      const formatted = (data || []).map((d: any) => ({
        ...d,
        employee: Array.isArray(d.employee) ? d.employee[0] || null : d.employee || null,
      }));
      setDeductions(formatted);
    }
    setDeductionsLoading(false);
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [projectId, fetchProject]);

  useEffect(() => {
    fetchEmployees();
  }, [selectedMonth, projectId, fetchEmployees]);

  useEffect(() => {
    fetchLogs();
    fetchDeductions();
  }, [projectId, fetchLogs, fetchDeductions]);

  useEffect(() => {
    let filtered = employees;
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(emp => emp.position === departmentFilter);
    }
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(emp =>
        emp.name.toLowerCase().includes(term) ||
        emp.email.toLowerCase().includes(term) ||
        (emp.position || '').toLowerCase().includes(term)
      );
    }
    setFilteredEmployees(filtered);
  }, [searchTerm, departmentFilter, employees]);

  const handleVerifyToday = async (employeeId: string) => {
    const today = dayjs().format('YYYY-MM-DD');
    const { error } = await supabase.from('attendance').insert([{
      employee_id: employeeId,
      date: today,
      status: 'present',
    }]);
    if (!error) {
      fetchEmployees();
    }
  };

  const totalPayroll = filteredEmployees.reduce(
    (acc, emp) => acc + emp.daily_wage * (emp.total_days || 0),
    0
  );

  const todayMissing = filteredEmployees.filter(emp => !emp.today_verified).length;

  const handleDeleteLog = async (id: string) => {
    if (!window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;
    await supabase.from('work_logs').delete().eq('id', id);
    fetchLogs();
  };
  const handleDeleteDeduction = async (id: string) => {
    if (!window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;
    await supabase.from('deductions').delete().eq('id', id);
    fetchDeductions();
  };

  // ------- Proje Ayarları Modalı --------

// Proje güncelle
const handleUpdateProject = async () => {
  const { error } = await supabase
    .from('projects')
    .update({ name: editName, description: editDescription })
    .eq('id', projectId);
  if (!error) {
    fetchProject();
    setSettingsOpen(false);
  }
};

// Proje sil
const handleDeleteProject = async () => {
  if (!window.confirm(
    'Bu projeyi SİLMEK istediğinize emin misiniz? Tüm çalışanlar, yevmiye, avans/kesinti ve katılım kayıtları kalıcı olarak silinir!'
  )) return;

  // Son kez emin olalım
  if (!window.confirm(
    'SON UYARI: Silinen veriler geri alınamaz. Devam etmek istiyor musunuz?'
  )) return;

  setIsDeleting(true);

  try {
    // İlişkili tüm verileri sil
    await supabase.from('attendance').delete().eq('project_id', projectId);
    await supabase.from('work_logs').delete().eq('project_id', projectId);
    await supabase.from('deductions').delete().eq('project_id', projectId);
    await supabase.from('employees').delete().eq('project_id', projectId);

    // Projenin kendisini sil
    const { error } = await supabase.from('projects').delete().eq('id', projectId);

    setIsDeleting(false);

    if (error) {
      alert('Proje silinemedi! Hata: ' + error.message);
    } else {
      alert('Proje ve tüm ilişkili kayıtlar başarıyla silindi.');
      router.push('/admin-panel/proje');
    }
  } catch (err: any) {
    setIsDeleting(false);
    alert('Beklenmeyen bir hata oluştu: ' + err.message);
  }
};

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Mobilde hamburger menü */}
        <div className="md:hidden mb-2">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow"
          >
            <FiMenu /> Menü
          </button>
          {mobileMenuOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-end">
              <div className="bg-white w-4/5 max-w-xs h-full rounded-l-xl shadow-lg p-5 flex flex-col gap-4">
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="self-end mb-2 text-2xl text-gray-500"
                  aria-label="Kapat"
                >
                  <FiX />
                </button>
                {actionButtons.map(btn => (
                  <ActionButton
                    key={btn.text}
                    icon={btn.icon}
                    text={btn.text}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      btn.onClick();
                    }}
                    color={btn.color}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Eylem Butonları Masaüstü */}
        <div className="hidden md:flex flex-wrap gap-3">
          {actionButtons.map(btn => (
            <ActionButton
              key={btn.text}
              icon={btn.icon}
              text={btn.text}
              onClick={btn.onClick}
              color={btn.color}
            />
          ))}
        </div>

        {/* Proje başlığı ve ayarlar */}
        <div className="flex items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-bold text-indigo-700 flex items-center gap-2">
            🧑‍💼 Yönetici Paneli
          </h1>
          {project && (
            <>
              <span className="text-lg text-gray-700 font-semibold">
                {project.name}
              </span>
              <button
                title="Proje Ayarları"
                onClick={() => setSettingsOpen(true)}
                className="ml-2 p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-800"
              >
                <FiSettings />
              </button>
            </>
          )}
        </div>
        {project && project.description && (
          <div className="text-gray-500 mb-2">{project.description}</div>
        )}
        <p className="text-gray-500">
          {dayjs().format('DD MMMM YYYY, dddd')}
        </p>

        {/* Proje Ayarları Modalı */}
        {settingsOpen && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-8 relative">
              <button
                className="absolute top-3 right-3 text-2xl text-gray-500"
                onClick={() => setSettingsOpen(false)}
                aria-label="Kapat"
              >
                <FiX />
              </button>
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><FiSettings /> Proje Ayarları</h2>
              <div className="mb-4">
                <label className="block font-medium mb-1">Proje Adı</label>
                <input
                  type="text"
                  className="border rounded-lg px-3 py-2 w-full"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium mb-1">Açıklama</label>
                <textarea
                  className="border rounded-lg px-3 py-2 w-full"
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <button
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium"
                  onClick={handleUpdateProject}
                >
                  Kaydet
                </button>
                <button
                  className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg"
                  onClick={() => setSettingsOpen(false)}
                >
                  Vazgeç
                </button>
                <button
                  className="ml-auto bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
                  onClick={handleDeleteProject}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Siliniyor...' : 'Projeyi Sil'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Proje silindiğinde tüm personel, kayıtlar ve veriler geri alınamaz şekilde silinir.
              </p>
            </div>
          </div>
        )}

        {/* Filtreler ve kontroller */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div></div>
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
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
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            <div className="flex items-center gap-2 bg-white px-3 py-2 border rounded-lg">
              <FiCalendar className="text-gray-400" />
              <input
                type="month"
                className="focus:outline-none"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>

            <button
              onClick={fetchEmployees}
              className="bg-white p-2 border rounded-lg hover:bg-gray-50"
              title="Yenile"
            >
              <FiRefreshCw className={`${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Toplam Personel"
            value={filteredEmployees.length}
            icon={<FiUserPlus />}
            color="bg-blue-100 text-blue-600"
          />
          <StatCard
            title="Bugün Onaysız"
            value={todayMissing}
            icon={<FiXCircle />}
            color="bg-red-100 text-red-600"
          />
          <StatCard
            title="Toplam Maaş Ödemesi"
            value={`₺ ${totalPayroll.toLocaleString()}`}
            icon={<FiDollarSign />}
            color="bg-green-100 text-green-600"
          />
          <StatCard
            title="Aylık Katılım"
            value={`${stats.present}/${stats.present + stats.absent}`}
            icon={<FiCheckCircle />}
            color="bg-purple-100 text-purple-600"
          />
        </div>

        {/* Personel Tablosu */}
        <div className="bg-white shadow rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <TableHeader>Ad</TableHeader>
                  <TableHeader>Pozisyon</TableHeader>
                  <TableHeader>Günlük Maaş</TableHeader>
                  <TableHeader>Çalışılan Gün</TableHeader>
                  <TableHeader>Toplam Maaş</TableHeader>
                  <TableHeader>Bugün</TableHeader>
                  <TableHeader>İşlemler</TableHeader>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      {employees.length === 0 ? 'Personel bulunamadı' : 'Filtreyle eşleşen personel yok'}
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="font-medium">{emp.name}</div>
                        <div className="text-sm text-gray-500">{emp.email}</div>
                      </TableCell>
                      <TableCell>{emp.position || '-'}</TableCell>
                      <TableCell>₺ {emp.daily_wage.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="font-medium">{emp.total_days}</div>
                        <div className="text-xs text-gray-500">
                          {emp.monthly_attendance?.filter(d => d > 0).length || 0} / {emp.monthly_attendance?.length || 0} gün
                        </div>
                      </TableCell>
                      <TableCell>₺ {(emp.daily_wage * (emp.total_days || 0)).toLocaleString()}</TableCell>
                      <TableCell>
                        {emp.today_verified ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <FiCheckCircle className="mr-1" /> Onaylı
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <FiXCircle className="mr-1" /> Onaysız
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {!emp.today_verified && (
                          <button
                            onClick={() => handleVerifyToday(emp.id)}
                            className="text-sm bg-indigo-50 text-indigo-600 px-3 py-1 rounded hover:bg-indigo-100"
                          >
                            Onayla
                          </button>
                        )}
                      </TableCell>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Yevmiye Kayıtları Tablosu */}
        <div className="border rounded-xl mt-6">
          <h3 className="bg-gray-100 px-4 py-2 flex items-center gap-2 font-semibold">
            <FiList /> Yevmiye Kayıtları
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-2 py-1 border">İşçi</th>
                  <th className="px-2 py-1 border">Tarih</th>
                  <th className="px-2 py-1 border">Tip</th>
                  <th className="px-2 py-1 border">Açıklama</th>
                  <th className="px-2 py-1 border">Sil</th>
                </tr>
              </thead>
              <tbody>
                {logsLoading ? (
                  <tr><td colSpan={5} className="text-center py-5">Yükleniyor...</td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-5 text-gray-400">Kayıt yok</td></tr>
                ) : logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="border px-2 py-1">{log.employee?.name || '-'}</td>
                    <td className="border px-2 py-1">{log.date}</td>
                    <td className="border px-2 py-1">{log.amount === 1 ? 'Tam Gün' : 'Yarım Gün'}</td>
                    <td className="border px-2 py-1">{log.description || '-'}</td>
                    <td className="border px-2 py-1 text-center">
                      <button
                        className="text-red-600 hover:bg-red-50 rounded p-1"
                        onClick={() => handleDeleteLog(log.id)}
                        title="Kaydı Sil"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Avans/Kesinti Kayıtları Tablosu */}
        <div className="border rounded-xl mt-6">
          <h3 className="bg-gray-100 px-4 py-2 flex items-center gap-2 font-semibold">
            <FiList /> Avans / Kesinti Kayıtları
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-2 py-1 border">İşçi</th>
                  <th className="px-2 py-1 border">Tarih</th>
                  <th className="px-2 py-1 border">Tür</th>
                  <th className="px-2 py-1 border">Tutar</th>
                  <th className="px-2 py-1 border">Açıklama</th>
                  <th className="px-2 py-1 border">Sil</th>
                </tr>
              </thead>
              <tbody>
                {deductionsLoading ? (
                  <tr><td colSpan={6} className="text-center py-5">Yükleniyor...</td></tr>
                ) : deductions.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-5 text-gray-400">Kayıt yok</td></tr>
                ) : deductions.map(ded => (
                  <tr key={ded.id} className="hover:bg-gray-50">
                    <td className="border px-2 py-1">{ded.employee?.name || '-'}</td>
                    <td className="border px-2 py-1">{ded.date}</td>
                    <td className="border px-2 py-1">{ded.type === 'advance' ? 'Avans' : 'Taşeron Kesintisi'}</td>
                    <td className="border px-2 py-1">{ded.amount} ₺</td>
                    <td className="border px-2 py-1">{ded.description || '-'}</td>
                    <td className="border px-2 py-1 text-center">
                      <button
                        className="text-red-600 hover:bg-red-50 rounded p-1"
                        onClick={() => handleDeleteDeduction(ded.id)}
                        title="Kaydı Sil"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

// Yardımcı bileşenler
function StatCard({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function ActionButton({ icon, text, onClick, color }: { icon: React.ReactNode; text: string; onClick: () => void; color: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 text-white px-4 py-2 rounded-lg transition-colors w-full md:w-auto ${color}`}
    >
      {icon}
      {text}
    </button>
  );
}

function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
      {children}
    </th>
  );
}

function TableCell({ children }: { children: React.ReactNode }) {
  return (
    <td className="px-6 py-4 whitespace-nowrap">
      {children}
    </td>
  );
}