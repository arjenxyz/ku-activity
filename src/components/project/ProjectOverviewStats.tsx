import { FiUsers, FiUserCheck, FiDollarSign, FiClipboard } from 'react-icons/fi';
import type { AttendanceStats } from '@/types/adminTypes';

type Props = {
  employeeCount: number;
  activeCount: number;
  todayMissing: number;
  totalPayroll: number;
  stats: AttendanceStats;
};

const items = [
  { key: 'employees', label: 'Toplam Personel', icon: FiUsers, color: 'text-blue-600' },
  { key: 'active', label: 'Aktif Personel', icon: FiUserCheck, color: 'text-emerald-600' },
  { key: 'missing', label: 'Bugün Onaysız', icon: FiClipboard, color: 'text-amber-600' },
  { key: 'payroll', label: 'Aylık Tahmini', icon: FiDollarSign, color: 'text-slate-700' },
] as const;

export function ProjectOverviewStats({
  employeeCount,
  activeCount,
  todayMissing,
  totalPayroll,
  stats,
}: Props) {
  const values: Record<string, string> = {
    employees: String(employeeCount),
    active: String(activeCount),
    missing: String(todayMissing),
    payroll: `₺${totalPayroll.toLocaleString('tr-TR')}`,
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map(({ key, label, icon: Icon, color }) => (
        <div
          key={key}
          className="bg-white border border-slate-200 rounded-lg px-5 py-4 shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              {label}
            </span>
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
          <p className="text-2xl font-semibold text-slate-900 tabular-nums">{values[key]}</p>
          {key === 'missing' && stats.present > 0 && (
            <p className="text-xs text-slate-500 mt-1">
              Bu ay {stats.present} yevmiye kaydı
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
