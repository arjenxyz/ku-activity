'use client';

import strings from '@json/src/app/admin-panel/arjen/sorgulama/[projectId]/page.json';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabaseClient';
import {
  FiChevronDown, FiUser, FiList, FiCreditCard, FiXCircle,
  FiDollarSign, FiCalendar, FiBriefcase, FiArrowLeft
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

const FILTER_CONFIG = [
  { value: 'all', icon: <FiList />, color: 'bg-indigo-100 text-indigo-600' },
  { value: 'work', icon: <FiBriefcase />, color: 'bg-green-100 text-green-600' },
  { value: 'advance', icon: <FiCreditCard />, color: 'bg-amber-100 text-amber-600' },
  { value: 'deduction', icon: <FiXCircle />, color: 'bg-red-100 text-red-600' },
  { value: 'salary', icon: <FiDollarSign />, color: 'bg-purple-100 text-purple-600' },
] as const;

type FilterValue = (typeof FILTER_CONFIG)[number]['value'];

export default function KisiselSorgulama() {
  const { projectId } = useParams();
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeDropdownOpen, setEmployeeDropdownOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterValue>('all');
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [deductions, setDeductions] = useState<Deduction[]>([]);
  const [loading, setLoading] = useState(false);

  const dayTypeLabel = (amount: number) => (amount === 1 ? strings.fullDay : strings.halfDay);

  const workLogColumns = [
    { label: strings.colDate, render: (r: WorkLog) => r.date },
    {
      label: strings.colType,
      render: (r: WorkLog) => (
        <span className={`px-2 py-1 rounded-full ${r.amount === 1 ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
          {dayTypeLabel(r.amount)}
        </span>
      ),
    },
    { label: strings.colDescription, render: (r: WorkLog) => r.description || strings.emptyValue },
  ];

  const advanceColumns = [
    { label: strings.colDate, render: (r: Deduction) => r.date },
    { label: strings.colAmount, render: (r: Deduction) => <span className="font-medium">{r.amount} ₺</span> },
    { label: strings.colDescription, render: (r: Deduction) => r.description || strings.emptyValue },
  ];

  const deductionColumns = [
    { label: strings.colDate, render: (r: Deduction) => r.date },
    { label: strings.colKind, render: (r: Deduction) => r.type },
    { label: strings.colAmount, render: (r: Deduction) => <span className="font-medium">{r.amount} ₺</span> },
    { label: strings.colDescription, render: (r: Deduction) => r.description || strings.emptyValue },
  ];

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

  const totalWork = workLogs.filter(w => w.amount === 1).length + workLogs.filter(w => w.amount !== 1).length * 0.5;
  const totalAdvance = deductions.filter(d => d.type === 'advance').reduce((acc, d) => acc + d.amount, 0);
  const totalDeduct = deductions.filter(d => d.type !== 'advance').reduce((acc, d) => acc + d.amount, 0);
  const netSalary = selectedEmployee ? totalWork * selectedEmployee.daily_wage - totalAdvance - totalDeduct : 0;

  const filteredContent = (() => {
    if (activeFilter === 'work') {
      return <RecordTable<WorkLog>
        title={strings.workLogsTitle}
        icon={<FiBriefcase className="text-green-600" />}
        records={workLogs}
        columns={workLogColumns}
      />;
    }

    if (activeFilter === 'advance') {
      return <RecordTable<Deduction>
        title={strings.advanceRecordsTitle}
        icon={<FiCreditCard className="text-amber-600" />}
        records={deductions.filter(d => d.type === 'advance')}
        columns={advanceColumns}
      />;
    }

    if (activeFilter === 'deduction') {
      return <RecordTable<Deduction>
        title={strings.deductionRecordsTitle}
        icon={<FiXCircle className="text-red-600" />}
        records={deductions.filter(d => d.type !== 'advance')}
        columns={deductionColumns}
      />;
    }

    if (activeFilter === 'salary') {
      return (
        <div className="grid md:grid-cols-2 gap-4">
          <SummaryCard
            title={strings.summaryTotalWork}
            value={totalWork}
            icon={<FiCalendar className="w-5 h-5" />}
            color="bg-indigo-100 text-indigo-600"
          />
          <SummaryCard
            title={strings.summaryTotalAdvance}
            value={`${totalAdvance} ₺`}
            icon={<FiCreditCard className="w-5 h-5" />}
            color="bg-amber-100 text-amber-600"
          />
          <SummaryCard
            title={strings.summaryTotalDeduction}
            value={`${totalDeduct} ₺`}
            icon={<FiXCircle className="w-5 h-5" />}
            color="bg-red-100 text-red-600"
          />
          <SummaryCard
            title={strings.summaryNetSalary}
            value={`${netSalary} ₺`}
            icon={<FiDollarSign className="w-5 h-5" />}
            color="bg-green-100 text-green-600"
          />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <RecordTable<WorkLog>
          title={strings.workLogsTitle}
          icon={<FiBriefcase className="text-green-600" />}
          records={workLogs}
          columns={workLogColumns}
        />

        <RecordTable<Deduction>
          title={strings.advanceRecordsTitle}
          icon={<FiCreditCard className="text-amber-600" />}
          records={deductions.filter(d => d.type === 'advance')}
          columns={advanceColumns}
        />

        <RecordTable<Deduction>
          title={strings.deductionRecordsTitle}
          icon={<FiXCircle className="text-red-600" />}
          records={deductions.filter(d => d.type !== 'advance')}
          columns={deductionColumns}
        />
      </div>
    );
  })();

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 rounded-full border border-indigo-100 bg-white shadow-sm px-3 py-2 text-indigo-600 hover:bg-indigo-50 transition hover:shadow-md focus:outline-none"
            title={strings.backTitle}
            style={{ minWidth: 0 }}
          >
            <FiArrowLeft size={20} />
            <span className="font-medium hidden sm:inline">{strings.backLabel}</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3 ml-4">
            <FiUser className="w-6 h-6 text-indigo-600" />
            <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
              {strings.pageTitle}
            </span>
          </h1>
        </div>

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
                <span className="text-gray-400">{strings.selectEmployee}</span>
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
                  <span>{emp.name}</span>
                  <span className="text-sm text-gray-400">{emp.position}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {FILTER_CONFIG.map(filter => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm shadow-sm transition
                ${activeFilter === filter.value ? `${filter.color} shadow-md` : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {filter.icon}
              {strings.filters[filter.value]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-20">{strings.loading}</div>
        ) : selectedEmployee ? (
          filteredContent
        ) : (
          <div className="text-center text-gray-400 py-20">{strings.selectEmployeeFirst}</div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <div className={`flex items-center gap-3 p-6 rounded-xl shadow-sm ${color}`}>
      <div className="w-12 h-12 flex items-center justify-center bg-white rounded-full text-2xl">
        {icon}
      </div>
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-lg font-bold">{value}</div>
      </div>
    </div>
  );
}

const RecordTable = <T,>({ title, icon, records, columns }: {
  title: string;
  icon: React.ReactNode;
  records: T[];
  columns: { label: string; render: (row: T) => React.ReactNode }[];
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
        {icon}
        <h3 className="font-semibold">{title}</h3>
      </div>

      {records.length === 0 ? (
        <div className="p-6 text-center text-gray-400">{strings.noRecords}</div>
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
