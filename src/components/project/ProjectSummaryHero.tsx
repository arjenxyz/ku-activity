'use client';

import Link from 'next/link';
import { FiBriefcase, FiMapPin, FiRefreshCw, FiUserCheck, FiUsers, FiDollarSign } from 'react-icons/fi';
import { TbQrcode } from 'react-icons/tb';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { formatMoney } from '@/lib/format';
import { formatString } from '@/lib/strings/format';
import { PROJECT_STATUS_LABELS } from '@/types/project';
import type { Project } from '@/types/project';

type Props = {
  project: Project;
  presentToday: number;
  activeCount: number;
  todayMissing: number;
  totalPayroll: number;
  projectId: string;
  onRefresh?: () => void;
  dossierSlot?: React.ReactNode;
};

export function ProjectSummaryHero({
  project,
  presentToday,
  activeCount,
  todayMissing,
  totalPayroll,
  projectId,
  onRefresh,
  dossierSlot,
}: Props) {
  const strings = useRegistryStrings('components/project/ProjectSummaryHero');

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
      <div className="pointer-events-none absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-blue-400/15 blur-3xl" />

      <div className="relative px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold leading-tight tracking-tight text-white sm:text-2xl">
                {project.name}
              </h1>
              <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold text-white/90 ring-1 ring-white/20">
                {PROJECT_STATUS_LABELS[project.status]}
              </span>
            </div>
            <p className="mt-1.5 inline-flex max-w-full items-center gap-1.5 text-sm text-blue-100/90">
              {project.location ? (
                <>
                  <FiMapPin className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                  <span className="truncate">{project.location}</span>
                </>
              ) : (
                <>
                  <FiBriefcase className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                  <span className="truncate">{project.code || strings.locationFallback}</span>
                </>
              )}
            </p>
          </div>
          {onRefresh ? (
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/80 ring-1 ring-white/15 transition hover:bg-white/15 hover:text-white"
              aria-label={strings.refresh}
              title={strings.refresh}
            >
              <FiRefreshCw className="h-4 w-4" />
            </button>
          ) : null}
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
          <p className="mt-1 text-xs text-slate-400">
            {formatString(strings.ofActive, { count: activeCount })}
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

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link
            href={`/admin-panel/proje/${projectId}/yevmiye`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3.5 py-2 text-xs font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/25"
          >
            <TbQrcode className="h-4 w-4" aria-hidden />
            {strings.qrAttendance}
          </Link>
          {dossierSlot}
        </div>
      </div>
    </section>
  );
}
