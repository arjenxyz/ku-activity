'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabaseClient';
import {
  FiChevronDown, FiUser, FiList, FiCreditCard, FiXCircle,
  FiDollarSign, FiCalendar, FiBriefcase, FiArrowUpRight, FiArrowLeft
} from 'react-icons/fi';

type Employee = {
  id: string;
  name: string;
  email: string;
  phone: string;
  daily_wage: number;
  position: string;
  hire_date: string;
  project_id: string;
};

type WorkLog = {
  id: string;
  date: string;
  amount: number;
  description: string | null;
};

type Deduction = {
  id: string;
  date: string;
  type: string;
  amount: number;
  description: string | null;
};

const FILTERS = [
  { value: 'all', label: 'Tüm Kayıtlar', icon: <FiList />, color: 'bg-indigo-100 text-indigo-600' },
  { value: 'work', label: 'Yevmiye', icon: <FiBriefcase />, color: 'bg-green-100 text-green-600' },
  { value: 'advance', label: 'Avanslar', icon: <FiCreditCard />, color: 'bg-amber-100 text-amber-600' },
  { value: 'deduction', label: 'Kesintiler', icon: <FiXCircle />, color: 'bg-red-100 text-red-600' },
  { value: 'salary', label: 'Maaş Özeti', icon: <FiDollarSign />, color: 'bg-purple-100 text-purple-600' },
];

export default function KisiselSorgulama() {
  const { projectId } = useParams();
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeDropdownOpen, setEmployeeDropdownOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState(FILTERS[0].value);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [deductions, setDeductions] = useState<Deduction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    (async () => {
      const { data } = await supabase
        .from('employees')
        .select('*')
        .eq('project_id', projectId)
        .order('name');
      setEmployees(data || []);
    })();
  }, [projectId]);

  useEffect(() => {
    if (!selectedEmployee) return;
    setLoading(true);
    (async () => {
      const { data: workData } = await supabase
        .from('work_logs')
        .select('*')
        .eq('employee_id', selectedEmployee.id)
        .order('date', { ascending: false });

      const { data: deductionsData } = await supabase
        .from('deductions')
        .select('*')
        .eq('employee_id', selectedEmployee.id)
        .order('date', { ascending: false });

      setWorkLogs(workData || []);
      setDeductions(deductionsData || []);
      setLoading(false);
    })();
  }, [selectedEmployee]);

  // Hesaplamalar
  const totalWork = workLogs.filter(w => w.amount === 1).length + workLogs.filter(w => w.amount !== 1).length * 0.5;
  const totalAdvance = deductions.filter(d => d.type === 'advance').reduce((acc, d) => acc + d.amount, 0);
  const totalDeduct = deductions.filter(d => d.type !== 'advance').reduce((acc, d) => acc + d.amount, 0);
  const netSalary = selectedEmployee ? totalWork * selectedEmployee.daily_wage - totalAdvance - totalDeduct : 0;

  // Filtrelenmiş içerik
  const filteredContent = (() => {
    if (activeFilter === 'work') {
      return <RecordTable
        title="Yevmiye Kayıtları"
        icon={<FiBriefcase className="text-green-600" />}
        records={workLogs}
        columns={[
          { label: 'Tarih', render: (r: WorkLog) => r.date },
          { label: 'Tip', render: (r: WorkLog) => (
            <span className={`px-2 py-1 rounded-full ${r.amount === 1 ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
              {r.amount === 1 ? 'Tam Gün' : 'Yarım Gün'}
            </span>
          )},
          { label: 'Açıklama', render: (r: WorkLog) => r.description || '-' }
        ]}
      />;
    }

    if (activeFilter === 'advance') {
      return <RecordTable
        title="Avans Kayıtları"
        icon={<FiCreditCard className="text-amber-600" />}
        records={deductions.filter(d => d.type === 'advance')}
        columns={[
          { label: 'Tarih', render: (r: Deduction) => r.date },
          { label: 'Tutar', render: (r: Deduction) => <span className="font-medium">{r.amount} ₺</span> },
          { label: 'Açıklama', render: (r: Deduction) => r.description || '-' }
        ]}
      />;
    }

    if (activeFilter === 'deduction') {
      return <RecordTable
        title="Kesinti Kayıtları"
        icon={<FiXCircle className="text-red-600" />}
        records={deductions.filter(d => d.type !== 'advance')}
        columns={[
          { label: 'Tarih', render: (r: Deduction) => r.date },
          { label: 'Tür', render: (r: Deduction) => r.type },
          { label: 'Tutar', render: (r: Deduction) => <span className="font-medium">{r.amount} ₺</span> },
          { label: 'Açıklama', render: (r: Deduction) => r.description || '-' }
        ]}
      />;
    }

    if (activeFilter === 'salary') {
      return (
        <div className="grid md:grid-cols-2 gap-4">
          <SummaryCard
            title="Toplam Çalışma"
            value={totalWork}
            icon={<FiCalendar className="w-5 h-5" />}
            color="bg-indigo-100 text-indigo-600"
          />
          <SummaryCard
            title="Toplam Avans"
            value={`${totalAdvance} ₺`}
            icon={<FiCreditCard className="w-5 h-5" />}
            color="bg-amber-100 text-amber-600"
          />
          <SummaryCard
            title="Toplam Kesinti"
            value={`${totalDeduct} ₺`}
            icon={<FiXCircle className="w-5 h-5" />}
            color="bg-red-100 text-red-600"
          />
          <SummaryCard
            title="Net Maaş"
            value={`${netSalary} ₺`}
            icon={<FiDollarSign className="w-5 h-5" />}
            color="bg-green-100 text-green-600"
          />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <RecordTable
          title="Yevmiye Kayıtları"
          icon={<FiBriefcase className="text-green-600" />}
          records={workLogs}
          columns={[
            { label: 'Tarih', render: (r: WorkLog) => r.date },
            { label: 'Tip', render: (r: WorkLog) => (
              <span className={`px-2 py-1 rounded-full ${r.amount === 1 ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                {r.amount === 1 ? 'Tam Gün' : 'Yarım Gün'}
              </span>
            )},
            { label: 'Açıklama', render: (r: WorkLog) => r.description || '-' }
          ]}
        />

        <RecordTable
          title="Avans Kayıtları"
          icon={<FiCreditCard className="text-amber-600" />}
          records={deductions.filter(d => d.type === 'advance')}
          columns={[
            { label: 'Tarih', render: (r: Deduction) => r.date },
            { label: 'Tutar', render: (r: Deduction) => <span className="font-medium">{r.amount} ₺</span> },
            { label: 'Açıklama', render: (r: Deduction) => r.description || '-' }
          ]}
        />

        <RecordTable
          title="Kesinti Kayıtları"
          icon={<FiXCircle className="text-red-600" />}
          records={deductions.filter(d => d.type !== 'advance')}
          columns={[
            { label: 'Tarih', render: (r: Deduction) => r.date },
            { label: 'Tür', render: (r: Deduction) => r.type },
            { label: 'Tutar', render: (r: Deduction) => <span className="font-medium">{r.amount} ₺</span> },
            { label: 'Açıklama', render: (r: Deduction) => r.description || '-' }
          ]}
        />
      </div>
    );
  })();

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Geri Butonu */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 rounded-full border border-indigo-100 bg-white shadow-sm px-3 py-2 text-indigo-600 hover:bg-indigo-50 transition hover:shadow-md focus:outline-none"
            title="Geri"
            style={{ minWidth: 0 }}
          >
            <FiArrowLeft size={20} />
            <span className="font-medium hidden sm:inline">Geri</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3 ml-4">
            <FiUser className="w-6 h-6 text-indigo-600" />
            <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
              Personel Sorgulama
            </span>
          </h1>
        </div>

        {/* Çalışan Seçim */}
        <div className="relative mb-6">
          <button
            onClick={() => setEmployeeDropdownOpen(!employeeDropdownOpen)}
            className="w-full flex items-center justify-between px-5 py-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-indigo-500 transition-colors"
          >
            <div className="flex items-center gap-3">
              {selectedEmployee ? (
                <>
                  <span className="font-medium text-gray-900">{selectedEmployee.name}</span>
                  <span className="text-sm text-gray-500">({selectedEmployee.position})</span>
                </>
              ) : (
                <span className="text-gray-400">Çalışan seçiniz...</span>
              )}
            </div>
            <FiChevronDown className={`transform transition-transform ${employeeDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {employeeDropdownOpen && (
            <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
              {employees.map(emp => (
                <div
                  key={emp.id}
                  onClick={() => {
                    setSelectedEmployee(emp);
                    setEmployeeDropdownOpen(false);
                  }}
                  className="px-5 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-gray-900">{emp.name}</div>
                    <div className="text-sm text-gray-500">{emp.position}</div>
                  </div>
                  <FiArrowUpRight className="text-gray-400" />
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedEmployee && (
          <>
            {/* Çalışan Bilgileri */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6 grid md:grid-cols-3 gap-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <FiUser className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Ad Soyad</div>
                  <div className="font-medium">{selectedEmployee.name}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <FiBriefcase className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Pozisyon</div>
                  <div className="font-medium">{selectedEmployee.position}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <FiDollarSign className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Günlük Ücret</div>
                  <div className="font-medium">{selectedEmployee.daily_wage} ₺</div>
                </div>
              </div>
            </div>

            {/* Filtreler */}
            <div className="flex flex-wrap gap-2 mb-6">
              {FILTERS.map(filter => (
                <button
                  key={filter.value}
                  onClick={() => setActiveFilter(filter.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    activeFilter === filter.value
                      ? `${filter.color} border border-indigo-500`
                      : 'bg-white border border-gray-200 hover:border-indigo-200'
                  }`}
                >
                  {filter.icon}
                  {filter.label}
                </button>
              ))}
            </div>

            {/* İçerik */}
            {loading ? (
              <div className="text-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-3 text-gray-500">Yükleniyor...</p>
              </div>
            ) : (
              filteredContent
            )}
          </>
        )}
      </div>
    </div>
  );
}

const RecordTable = ({ title, icon, records, columns }: {
  title: string;
  icon: React.ReactNode;
  records: any[];
  columns: { label: string; render: (row: any) => any }[];
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
        {icon}
        <h3 className="font-semibold">{title}</h3>
      </div>

      {records.length === 0 ? (
        <div className="p-6 text-center text-gray-400">Kayıt bulunamadı</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((col, index) => (
                  <th key={index} className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {records.map((record, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className="px-6 py-4 text-sm">
                      {col.render(record)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const SummaryCard = ({ title, value, icon, color }: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) => {
  return (
    <div className={`${color} rounded-xl p-4`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-600">{title}</div>
          <div className="text-2xl font-bold mt-1">{value}</div>
        </div>
        <div className="p-2 bg-white/30 rounded-lg">
          {icon}
        </div>
      </div>
    </div>
  );
};
