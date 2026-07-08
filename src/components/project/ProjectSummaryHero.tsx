'use client';

import { FiArrowRight, FiBriefcase, FiMapPin, FiUserCheck, FiUsers, FiDollarSign } from 'react-icons/fi';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { formatMoney } from '@/lib/format';
import { PROJECT_STATUS_LABELS, type Project } from '@/types/project';

type Props = {
  project: Project;
  presentToday: number;
  activeCount: number;
  todayMissing: number;
  totalPayroll: number;
  onOpenAttendance?: () => void;
};

export function ProjectSummaryHero({
  project,
  presentToday,
  activeCount,
  todayMissing,
  totalPayroll,
  onOpenAttendance,
}: Props) {
  const strings = useRegistryStrings('components/project/ProjectSummaryHero');
  const subtitle = project.location?.trim() || project.code || strings.locationFallback;

  return (
    <section
      aria-label={strings.sectionAriaLabel}
      className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#0E1548] via-[#152060] to-indigo-950 text-white shadow-xl shadow-[#0E1548]/25 ring-1 ring-white/10"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'radial-gradient(circle at 90% 10%, rgba(96,165,250,0.45) 0%, transparent 42%), radial-gradient(circle at 10% 90%, rgba(129,140,248,0.3) 0%, transparent 40%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div className="pointer-events-none absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-blue-400/15 blur-3xl" />

      <div className="relative px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div className="relative shrink-0">
            <div
              className="absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-white/30 via-white/10 to-transparent blur-[1px]"
              aria-hidden
            />
            <div className="relative flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-2xl bg-white/10 ring-2 ring-white/30 shadow-lg shadow-black/25 sm:h-[4.75rem] sm:w-[4.75rem]">
              <FiBriefcase className="h-7 w-7 text-white/90 sm:h-8 sm:w-8" aria-hidden />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="break-words text-xl font-bold leading-tight tracking-tight text-white sm:text-2xl">
              {project.name}
            </h1>
            <p className="mt-1.5 inline-flex max-w-full items-center gap-1.5 text-sm text-blue-100/90">
              <FiMapPin className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
              <span className="truncate">{subtitle}</span>
            </p>
            <span className="mt-2 inline-flex rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-white/85 ring-1 ring-white/15">
              {PROJECT_STATUS_LABELS[project.status]}
            </span>
          </div>
        </div>

        <div
          className="my-4 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent sm:my-5"
          aria-hidden
        />

        <div>
          <p className="text-xs font-medium text-slate-400">{strings.presentToday}</p>
          <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-emerald-300 sm:text-4xl">
            {presentToday}
          </p>
        </div>

        <div
          className="my-4 h-px bg-gradient-to-r from-emerald-400/70 via-blue-400/50 to-transparent sm:my-5"
          aria-hidden
        />

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-xl border border-white/10 bg-white/8 px-3 py-2.5">
            <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <FiUsers className="h-3 w-3 text-blue-300" aria-hidden />
              {strings.active}
            </p>
            <p className="mt-1 text-sm font-semibold tabular-nums">{activeCount}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/8 px-3 py-2.5">
            <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <FiUserCheck className="h-3 w-3 text-amber-300" aria-hidden />
              {strings.missing}
            </p>
            <p className="mt-1 text-sm font-semibold tabular-nums">{todayMissing}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/8 px-3 py-2.5">
            <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <FiDollarSign className="h-3 w-3 text-emerald-300" aria-hidden />
              {strings.payroll}
            </p>
            <p className="mt-1 truncate text-sm font-semibold tabular-nums">{formatMoney(totalPayroll)}</p>
          </div>
        </div>

        {onOpenAttendance ? (
          <button
            type="button"
            onClick={onOpenAttendance}
            className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-200 transition-colors hover:text-white"
          >
            {strings.openAttendance}
            <FiArrowRight className="h-3.5 w-3.5" aria-hidden />
          </button>
        ) : null}
      </div>
    </section>
  );
}
