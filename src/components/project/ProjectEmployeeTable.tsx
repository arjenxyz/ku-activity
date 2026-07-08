import { FiCheckCircle, FiClock } from 'react-icons/fi';
import { EmployeeAvatar } from '@/components/employee/EmployeeAvatar';
import { EmployeePhotoUpload } from '@/components/employee/EmployeePhotoUpload';
import type { Employee } from '@/types/adminTypes';
import strings from '@json/src/components/project/ProjectEmployeeTable.json';

type Props = {
  employees: Employee[];
  loading: boolean;
  projectId: string;
  onPhotoChange?: (employeeId: string, photoUrl: string | null) => void;
};

function StatusBadge({ status }: { status: Employee['today_attendance_status'] }) {
  if (status === 'confirmed') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
        <FiCheckCircle className="w-3.5 h-3.5" />
        {strings.status.confirmed}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
      <FiClock className="w-3.5 h-3.5" />
      {strings.status.none}
    </span>
  );
}

export function ProjectEmployeeTable({
  employees,
  loading,
  projectId,
  onPhotoChange,
}: Props) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.04]">
      <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#0E1548]">
          {strings.title}
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left font-semibold text-slate-600 px-4 py-3 w-14">{strings.photoHeader}</th>
              <th className="text-left font-semibold text-slate-600 px-6 py-3">{strings.nameHeader}</th>
              <th className="text-left font-semibold text-slate-600 px-6 py-3 hidden md:table-cell">{strings.positionHeader}</th>
              <th className="text-left font-semibold text-slate-600 px-6 py-3 hidden sm:table-cell">{strings.dailyWageHeader}</th>
              <th className="text-left font-semibold text-slate-600 px-6 py-3 hidden lg:table-cell">{strings.monthHeader}</th>
              <th className="text-left font-semibold text-slate-600 px-6 py-3">{strings.todayHeader}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                  {strings.loading}
                </td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                  {strings.empty}
                </td>
              </tr>
            ) : (
              employees.map((emp) => {
                const monthDays = emp.monthly_attendance?.filter((d) => d > 0).length ?? 0;
                const status = emp.today_attendance_status ?? 'none';

                return (
                  <tr key={emp.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      {onPhotoChange ? (
                        <EmployeePhotoUpload
                          projectId={projectId}
                          employeeId={emp.id}
                          name={emp.name}
                          photoUrl={emp.photo_url ?? null}
                          onChange={(url) => onPhotoChange(emp.id, url)}
                          compact
                        />
                      ) : (
                        <EmployeeAvatar name={emp.name} photoUrl={emp.photo_url} size="sm" />
                      )}
                    </td>
                    <td className="px-6 py-3.5 font-medium text-slate-900">
                      {emp.name}
                      <span className="block md:hidden text-xs text-slate-500">{emp.position}</span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 hidden md:table-cell">
                      {emp.position || strings.emptyValue}
                    </td>
                    <td className="px-6 py-3.5 text-slate-900 hidden sm:table-cell tabular-nums">
                      ₺{emp.daily_wage.toLocaleString('tr-TR')}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 hidden lg:table-cell">
                      {monthDays}{strings.daysSuffix}
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={status} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
