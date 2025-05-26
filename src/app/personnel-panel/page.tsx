'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import { FiUser, FiList, FiCreditCard, FiXCircle, FiDollarSign, FiCalendar, FiBriefcase } from 'react-icons/fi';
import dayjs from 'dayjs';

// Cookie'den session token'ı alır
function getSessionTokenFromCookie() {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/personnel_session=([^;]+)/);
  return match ? match[1] : null;
}

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

// Modern dark palette for official/corporate look
const FILTERS = [
  {
    value: 'all',
    label: 'Tüm Kayıtlar',
    icon: <FiList />,
    color: 'bg-[#20304a]/70 text-[#7FB4FF] dark:bg-[#20304a]/70 dark:text-[#7FB4FF]',
    border: 'border-[#28344a]'
  },
  {
    value: 'work',
    label: 'Yevmiye',
    icon: <FiBriefcase />,
    color: 'bg-[#1E3231]/70 text-[#5BE49B] dark:bg-[#1E3231]/70 dark:text-[#5BE49B]',
    border: 'border-[#28344a]'
  },
  {
    value: 'advance',
    label: 'Avanslar',
    icon: <FiCreditCard />,
    color: 'bg-[#2C241A]/70 text-[#FFB86B] dark:bg-[#2C241A]/70 dark:text-[#FFB86B]',
    border: 'border-[#28344a]'
  },
  {
    value: 'deduction',
    label: 'Kesintiler',
    icon: <FiXCircle />,
    color: 'bg-[#382022]/70 text-[#FF7F7F] dark:bg-[#382022]/70 dark:text-[#FF7F7F]',
    border: 'border-[#28344a]'
  },
  {
    value: 'salary',
    label: 'Maaş Özeti',
    icon: <FiDollarSign />,
    color: 'bg-[#251E31]/70 text-[#B085F5] dark:bg-[#251E31]/70 dark:text-[#B085F5]',
    border: 'border-[#28344a]'
  },
];

export default function PersonelPanel() {
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [deductions, setDeductions] = useState<Deduction[]>([]);
  const [activeFilter, setActiveFilter] = useState(FILTERS[0].value);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sessionToken = getSessionTokenFromCookie();
    if (!sessionToken) {
      router.replace('/personnel-login');
      return;
    }

    (async () => {
      // Session'ı kontrol et
      const { data: session, error: sessionError } = await supabase
        .from('personnel_sessions')
        .select('employee_id, expires_at')
        .eq('session_token', sessionToken)
        .single();

      if (!session || sessionError || dayjs(session.expires_at).isBefore(dayjs())) {
        router.replace('/personnel-login');
        return;
      }

      // Personel bilgisi
      const { data: employeeData } = await supabase
        .from('employees')
        .select('*')
        .eq('id', session.employee_id)
        .single();
      setEmployee(employeeData);

      // Kayıtlar
      setLoading(true);
      const { data: workData } = await supabase
        .from('work_logs')
        .select('*')
        .eq('employee_id', session.employee_id)
        .order('date', { ascending: false });
      const { data: deductionsData } = await supabase
        .from('deductions')
        .select('*')
        .eq('employee_id', session.employee_id)
        .order('date', { ascending: false });

      setWorkLogs(workData || []);
      setDeductions(deductionsData || []);
      setLoading(false);
    })();
  }, [router]);

  // Hesaplamalar
  const totalWork = workLogs.filter(w => w.amount === 1).length + workLogs.filter(w => w.amount !== 1).length * 0.5;
  const totalEarned = employee ? totalWork * employee.daily_wage : 0;
  const totalAdvance = deductions.filter(d => d.type === 'advance').reduce((acc, d) => acc + d.amount, 0);
  const totalDeduct = deductions.filter(d => d.type !== 'advance').reduce((acc, d) => acc + d.amount, 0);
  const netSalary = employee ? totalEarned - totalAdvance - totalDeduct : 0;

  // Filtreye göre içerik
  const filteredContent = (() => {
    if (activeFilter === 'work') {
      return <RecordTable
        title="Yevmiye Kayıtları"
        icon={<FiBriefcase className="text-[#5BE49B]" />}
        records={workLogs}
        columns={[
          { label: 'Tarih', render: (r: WorkLog) => r.date },
          { label: 'Tip', render: (r: WorkLog) => (
            <span className={`px-2 py-1 rounded-full ${r.amount === 1
              ? 'bg-[#1E3231]/40 text-[#5BE49B]'
              : 'bg-[#2C241A]/40 text-[#FFB86B]'}`}>
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
        icon={<FiCreditCard className="text-[#FFB86B]" />}
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
        icon={<FiXCircle className="text-[#FF7F7F]" />}
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
            color="bg-[#20304a]/80 text-[#7FB4FF]"
          />
          <SummaryCard
            title="Toplam Aldığı Para"
            value={`${totalEarned} ₺`}
            icon={<FiDollarSign className="w-5 h-5" />}
            color="bg-[#20304a]/80 text-[#7FB4FF]"
          />
          <SummaryCard
            title="Toplam Avans"
            value={`${totalAdvance} ₺`}
            icon={<FiCreditCard className="w-5 h-5" />}
            color="bg-[#2C241A]/80 text-[#FFB86B]"
          />
          <SummaryCard
            title="Toplam Kesinti"
            value={`${totalDeduct} ₺`}
            icon={<FiXCircle className="w-5 h-5" />}
            color="bg-[#382022]/80 text-[#FF7F7F]"
          />
          <SummaryCard
            title="Net Maaş"
            value={`${netSalary} ₺`}
            icon={<FiDollarSign className="w-5 h-5" />}
            color="bg-[#1E3231]/80 text-[#5BE49B]"
          />
        </div>
      );
    }
    // Tüm Kayıtlar
    return (
      <div className="space-y-6">
        <RecordTable
          title="Yevmiye Kayıtları"
          icon={<FiBriefcase className="text-[#5BE49B]" />}
          records={workLogs}
          columns={[
            { label: 'Tarih', render: (r: WorkLog) => r.date },
            { label: 'Tip', render: (r: WorkLog) => (
              <span className={`px-2 py-1 rounded-full ${r.amount === 1
                ? 'bg-[#1E3231]/40 text-[#5BE49B]'
                : 'bg-[#2C241A]/40 text-[#FFB86B]'}`}>
                {r.amount === 1 ? 'Tam Gün' : 'Yarım Gün'}
              </span>
            )},
            { label: 'Açıklama', render: (r: WorkLog) => r.description || '-' }
          ]}
        />
        <RecordTable
          title="Avans Kayıtları"
          icon={<FiCreditCard className="text-[#FFB86B]" />}
          records={deductions.filter(d => d.type === 'advance')}
          columns={[
            { label: 'Tarih', render: (r: Deduction) => r.date },
            { label: 'Tutar', render: (r: Deduction) => <span className="font-medium">{r.amount} ₺</span> },
            { label: 'Açıklama', render: (r: Deduction) => r.description || '-' }
          ]}
        />
        <RecordTable
          title="Kesinti Kayıtları"
          icon={<FiXCircle className="text-[#FF7F7F]" />}
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
    <div className="min-h-screen bg-[#181C25] dark:bg-[#181C25] text-[#E8EAED] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold flex items-center gap-3 text-[#E8EAED]">
            <FiUser className="w-6 h-6 text-[#7FB4FF]" />
            <span className="bg-gradient-to-r from-[#7FB4FF] to-[#B085F5] bg-clip-text text-transparent">
              Personel Paneli
            </span>
          </h1>
        </div>
        {employee && (
          <>
            <div className="bg-[#23293A] rounded-xl shadow-sm p-6 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 border border-[#28344a]">
              <InfoBlock
                icon={<FiUser className="w-5 h-5 text-[#7FB4FF]" />}
                label="Ad Soyad"
                value={employee.name}
              />
              <InfoBlock
                icon={<FiBriefcase className="w-5 h-5 text-[#7FB4FF]" />}
                label="Pozisyon"
                value={employee.position}
              />
              <InfoBlock
                icon={<FiDollarSign className="w-5 h-5 text-[#7FB4FF]" />}
                label="Günlük Ücret"
                value={`${employee.daily_wage} ₺`}
              />
              <InfoBlock
                icon={<FiDollarSign className="w-5 h-5 text-[#B085F5]" />}
                label="Toplam Aldığı"
                value={`${totalEarned} ₺`}
              />
            </div>
            <div className="flex flex-wrap gap-2 mb-6">
              {FILTERS.map(filter => (
                <button
                  key={filter.value}
                  onClick={() => setActiveFilter(filter.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium border ${filter.border} ${
                    activeFilter === filter.value
                      ? `${filter.color} ring-2 ring-[#7FB4FF]`
                      : 'bg-[#222736] text-[#B5B8C5] hover:bg-[#233A5B]/30'
                  }`}
                >
                  {filter.icon}
                  {filter.label}
                </button>
              ))}
            </div>
            {loading ? (
              <div className="text-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7FB4FF] mx-auto"></div>
                <p className="mt-3 text-[#B5B8C5]">Yükleniyor...</p>
              </div>
            ) : (
              filteredContent
            )}
          </>
        )}
        {!employee && (
          <div className="text-center text-[#B5B8C5] text-lg mt-20">
            Personel bilgisi bulunamadı. Lütfen tekrar giriş yapın.
          </div>
        )}
      </div>
    </div>
  );
}

// Bilgi bloğu
const InfoBlock = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) => (
  <div className="flex items-center gap-3">
    <div className="p-2 bg-[#20304a]/60 rounded-lg">
      {icon}
    </div>
    <div>
      <div className="text-sm text-[#B5B8C5]">{label}</div>
      <div className="font-medium text-[#E8EAED]">{value}</div>
    </div>
  </div>
);

const RecordTable = ({ title, icon, records, columns }: { 
  title: string;
  icon: React.ReactNode;
  records: any[];
  columns: { label: string; render: (row: any) => any }[];
}) => {
  return (
    <div className="bg-[#23293A] rounded-xl shadow-sm border border-[#28344a] overflow-hidden">
      <div className="px-6 py-4 border-b border-[#28344a] flex items-center gap-3">
        {icon}
        <h3 className="font-semibold text-[#E8EAED]">{title}</h3>
      </div>
      {records.length === 0 ? (
        <div className="p-6 text-center text-[#B5B8C5]">Kayıt bulunamadı</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1A1F2B]">
              <tr>
                {columns.map((col, index) => (
                  <th key={index} className="px-6 py-3 text-left text-sm font-medium text-[#B5B8C5]">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#28344a]">
              {records.map((record, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-[#20304a]/40 transition-colors">
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className="px-6 py-4 text-sm text-[#E8EAED]">
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
          <div className="text-sm text-[#B5B8C5]">{title}</div>
          <div className="text-2xl font-bold text-[#E8EAED] mt-1">{value}</div>
        </div>
        <div className="p-2 bg-white/10 rounded-lg">
          {icon}
        </div>
      </div>
    </div>
  );
};