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
      const { data: session, error: sessionError } = await supabase
        .from('personnel_sessions')
        .select('employee_id, expires_at')
        .eq('session_token', sessionToken)
        .single();

      if (!session || sessionError || dayjs(session.expires_at).isBefore(dayjs())) {
        router.replace('/personnel-login');
        return;
      }

      
      const { data: employeeData } = await supabase
  .from('employees')
  .select('*')
  .eq('id', session.employee_id)
  .single();
setEmployee(employeeData as Employee);

const { data: workData } = await supabase
  .from('work_logs')
  .select('*')
  .eq('employee_id', session.employee_id)
  .order('date', { ascending: false });
setWorkLogs(workData as WorkLog[]);

const { data: deductionsData } = await supabase
  .from('deductions')
  .select('*')
  .eq('employee_id', session.employee_id)
  .order('date', { ascending: false });
setDeductions(deductionsData as Deduction[]);
      setWorkLogs(workData || []);
      setDeductions(deductionsData || []);
      setLoading(false);
    })();
  }, [router]);

  const totalWork = workLogs.filter(w => w.amount === 1).length + workLogs.filter(w => w.amount !== 1).length * 0.5;
  const totalEarned = employee ? totalWork * employee.daily_wage : 0;
  const totalAdvance = deductions.filter(d => d.type === 'advance').reduce((acc, d) => acc + d.amount, 0);
  const totalDeduct = deductions.filter(d => d.type !== 'advance').reduce((acc, d) => acc + d.amount, 0);
  const netSalary = employee ? totalEarned - totalAdvance - totalDeduct : 0;

  const filteredContent = (() => {
    if (activeFilter === 'work') {
      return (
        <RecordTable<WorkLog>
          title="Yevmiye Kayıtları"
          icon={<FiBriefcase className="text-[#5BE49B]" />}
          records={workLogs}
          columns={[
            { label: 'Tarih', render: (r) => r.date },
            {
              label: 'Tip',
              render: (r) => (
                <span
                  className={`px-2 py-1 rounded-full ${
                    r.amount === 1
                      ? 'bg-[#1E3231]/40 text-[#5BE49B]'
                      : 'bg-[#2C241A]/40 text-[#FFB86B]'
                  }`}
                >
                  {r.amount === 1 ? 'Tam Gün' : 'Yarım Gün'}
                </span>
              )
            },
            { label: 'Açıklama', render: (r) => r.description || '-' }
          ]}
        />
      );
    }
    if (activeFilter === 'advance') {
      return (
        <RecordTable<Deduction>
          title="Avans Kayıtları"
          icon={<FiCreditCard className="text-[#FFB86B]" />}
          records={deductions.filter(d => d.type === 'advance')}
          columns={[
            { label: 'Tarih', render: (r) => r.date },
            { label: 'Tutar', render: (r) => <span className="font-medium">{r.amount} ₺</span> },
            { label: 'Açıklama', render: (r) => r.description || '-' }
          ]}
        />
      );
    }
    if (activeFilter === 'deduction') {
      return (
        <RecordTable<Deduction>
          title="Kesinti Kayıtları"
          icon={<FiXCircle className="text-[#FF7F7F]" />}
          records={deductions.filter(d => d.type !== 'advance')}
          columns={[
            { label: 'Tarih', render: (r) => r.date },
            { label: 'Tutar', render: (r) => <span className="font-medium">{r.amount} ₺</span> },
            { label: 'Açıklama', render: (r) => r.description || '-' }
          ]}
        />
      );
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
    return (
      <div className="space-y-6">
        <RecordTable<WorkLog>
          title="Yevmiye Kayıtları"
          icon={<FiBriefcase className="text-[#5BE49B]" />}
          records={workLogs}
          columns={[
            { label: 'Tarih', render: (r) => r.date },
            {
              label: 'Tip',
              render: (r) => (
                <span
                  className={`px-2 py-1 rounded-full ${
                    r.amount === 1
                      ? 'bg-[#1E3231]/40 text-[#5BE49B]'
                      : 'bg-[#2C241A]/40 text-[#FFB86B]'
                  }`}
                >
                  {r.amount === 1 ? 'Tam Gün' : 'Yarım Gün'}
                </span>
              )
            },
            { label: 'Açıklama', render: (r) => r.description || '-' }
          ]}
        />
        <RecordTable<Deduction>
          title="Avans Kayıtları"
          icon={<FiCreditCard className="text-[#FFB86B]" />}
          records={deductions.filter(d => d.type === 'advance')}
          columns={[
            { label: 'Tarih', render: (r) => r.date },
            { label: 'Tutar', render: (r) => <span className="font-medium">{r.amount} ₺</span> },
            { label: 'Açıklama', render: (r) => r.description || '-' }
          ]}
        />
        <RecordTable<Deduction>
          title="Kesinti Kayıtları"
          icon={<FiXCircle className="text-[#FF7F7F]" />}
          records={deductions.filter(d => d.type !== 'advance')}
          columns={[
            { label: 'Tarih', render: (r) => r.date },
            { label: 'Tutar', render: (r) => <span className="font-medium">{r.amount} ₺</span> },
            { label: 'Açıklama', render: (r) => r.description || '-' }
          ]}
        />
      </div>
    );
  })();

  return (
    <div className="min-h-screen bg-[#181C25] dark:bg-[#181C25] text-[#E8EAED] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Personel Paneli</h1>
          {employee && (
            <div className="flex items-center gap-3 bg-[#23293A] p-3 rounded-xl shadow-sm border border-[#28344a]">
              <FiUser className="text-[#7FB4FF] w-6 h-6" />
              <div>
                <p className="font-semibold">{employee.name}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3 mb-8">
          {FILTERS.map(filter => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors ${filter.border} ${
                activeFilter === filter.value ? filter.color : 'text-[#B5B8C5] hover:bg-[#28344a]'
              }`}
            >
              {filter.icon}
              {filter.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20">Yükleniyor...</div>
        ) : (
          filteredContent
        )}
      </div>
    </div>
  );
}

type Column<T> = {
  label: string;
  render: (row: T) => React.ReactNode;
};

function RecordTable<T>({
  title,
  icon,
  records,
  columns
}: {
  title: string;
  icon: React.ReactNode;
  records: T[];
  columns: Column<T>[];
}) {
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
                {columns.map((col, idx) => (
                  <th key={idx} className="px-6 py-3 text-left text-sm font-medium text-[#B5B8C5]">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#28344a]">
              {records.map((record, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-[#20304a]/40 transition-colors">
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className="px-6 py-4 text-sm text-[#E8EAED]">
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
}

function SummaryCard({
  title,
  value,
  icon,
  color
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className={`rounded-xl p-6 flex items-center gap-4 shadow-sm border border-[#28344a] ${color}`}>
      <div className="w-12 h-12 flex items-center justify-center bg-white/10 rounded-lg">{icon}</div>
      <div>
        <p className="text-sm text-[#B5B8C5]">{title}</p>
        <p className="font-semibold text-lg">{value}</p>
      </div>
    </div>
  );
}
