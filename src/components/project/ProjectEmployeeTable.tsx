'use client';

import { FiCheckCircle, FiClock } from 'react-icons/fi';
import { EmployeeAvatar } from '@/components/employee/EmployeeAvatar';
import { EmployeePhotoUpload } from '@/components/employee/EmployeePhotoUpload';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import type { Employee } from '@/types/adminTypes';

type Props = {
  employees: Employee[];
  loading: boolean;
  projectId: string;
  onPhotoChange?: (employeeId: string, photoUrl: string | null) => void;
};

function StatusBadge({
  status,
  confirmedLabel,
  noneLabel,
}: {
  status: Employee['today_attendance_status'];
  confirmedLabel: string;
  noneLabel: string;
}) {
  if (status === 'confirmed') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
        <FiCheckCircle className="h-3.5 w-3.5" />
        {confirmedLabel}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500 ring-1 ring-slate-100">
      <FiClock className="h-3.5 w-3.5" />
      {noneLabel}
    </span>
  );
}

export function ProjectEmployeeTable({
  employees,
  loading,
  projectId,
  onPhotoChange,
}: Props) {
  const strings = useRegistryStrings('components/project/ProjectEmployeeTable');

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm sm:rounded-3xl">
      <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
        <h2 className="text-sm font-semibold text-slate-900">{strings.title}</h2>
        <p className="mt-0.5 text-xs text-slate-500">{strings.subtitle}</p>
      </div>

      {loading ? (
        <div className="px-4 py-12 text-center text-sm text-slate-500 sm:px-5">{strings.loading}</div>
      ) : employees.length === 0 ? (
        <div className="px-4 py-12 text-center text-sm text-slate-500 sm:px-5">{strings.empty}</div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {employees.map((emp) => {
            const monthDays = emp.monthly_attendance?.filter((d) => d > 0).length ?? 0;
            const status = emp.today_attendance_status ?? 'none';

            return (
              <li key={emp.id} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
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

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{emp.name}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {emp.position || strings.emptyValue}
                    <span className="mx-1.5 text-slate-300">·</span>
                    ₺{emp.daily_wage.toLocaleString('tr-TR')}
                    <span className="mx-1.5 text-slate-300">·</span>
                    {monthDays}
                    {strings.daysSuffix}
                  </p>
                </div>

                <StatusBadge
                  status={status}
                  confirmedLabel={strings.status.confirmed}
                  noneLabel={strings.status.none}
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
