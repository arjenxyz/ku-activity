'use client';

import Link from 'next/link';
import { FiCheckCircle, FiChevronRight, FiClock } from 'react-icons/fi';
import { EmployeeAvatar } from '@/components/employee/EmployeeAvatar';
import { EmployeePhotoUpload } from '@/components/employee/EmployeePhotoUpload';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import type { Employee } from '@/types/adminTypes';

type Props = {
  employees: Employee[];
  loading: boolean;
  projectId: string;
  onPhotoChange?: (employeeId: string, photoUrl: string | null) => void;
  /** Özet için kısaltılmış liste; tıklanınca tam listeye */
  previewLimit?: number;
  listHref?: string;
};

export function ProjectEmployeeTable({
  employees,
  loading,
  projectId,
  onPhotoChange,
  previewLimit = 6,
  listHref,
}: Props) {
  const strings = useRegistryStrings('components/project/ProjectEmployeeTable');
  const visible = employees.slice(0, previewLimit);
  const hasMore = employees.length > previewLimit;
  const href = listHref ?? `/admin-panel/proje/${projectId}/list`;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm sm:rounded-3xl">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-900">{strings.title}</h2>
          <p className="mt-0.5 text-xs text-slate-500">{strings.subtitle}</p>
        </div>
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          {strings.seeAll}
          <FiChevronRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3 p-4 sm:p-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="h-10 w-10 rounded-full bg-slate-200" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 rounded bg-slate-200" />
                <div className="h-2.5 w-24 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : employees.length === 0 ? (
        <div className="px-4 py-12 text-center text-sm text-slate-500 sm:px-5">{strings.empty}</div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {visible.map((emp) => {
            const monthDays = emp.monthly_attendance?.filter((d) => d > 0).length ?? 0;
            const confirmed = emp.today_attendance_status === 'confirmed' || emp.today_verified;

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
                    {monthDays}
                    {strings.daysSuffix}
                  </p>
                </div>

                {confirmed ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
                    <FiCheckCircle className="h-3.5 w-3.5" />
                    {strings.confirmed}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-100">
                    <FiClock className="h-3.5 w-3.5" />
                    {strings.none}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {!loading && hasMore ? (
        <div className="border-t border-slate-100 px-4 py-3 sm:px-5">
          <Link
            href={href}
            className="flex w-full items-center justify-center gap-1 rounded-xl bg-slate-50 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            {strings.seeAll}
            <FiChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : null}
    </section>
  );
}
