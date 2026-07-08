'use client';

import type { IconType } from 'react-icons';
import Link from 'next/link';
import { FiCheckCircle, FiClock, FiUsers } from 'react-icons/fi';
import { TbQrcode } from 'react-icons/tb';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { formatString } from '@/lib/strings/format';
import type { Project } from '@/types/project';

type VisualState = 'all' | 'partial' | 'pending' | 'empty';

type Props = {
  project: Project;
  projectId: string;
  presentCount: number;
  missingCount: number;
  totalCount: number;
};

function resolveState(total: number, present: number, missing: number): VisualState {
  if (total === 0) return 'empty';
  if (missing === 0) return 'all';
  if (present === 0) return 'pending';
  return 'partial';
}

function stateStyle(state: VisualState): {
  shell: string;
  badge: string;
  iconWrap: string;
  Icon: IconType;
} {
  switch (state) {
    case 'all':
      return {
        shell:
          'border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 via-white to-white',
        badge: 'text-emerald-700',
        iconWrap: 'bg-emerald-100 text-emerald-600',
        Icon: FiCheckCircle,
      };
    case 'partial':
      return {
        shell: 'border-sky-200/80 bg-gradient-to-br from-sky-50/90 via-white to-white',
        badge: 'text-sky-700',
        iconWrap: 'bg-sky-100 text-sky-600',
        Icon: FiClock,
      };
    case 'empty':
      return {
        shell: 'border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-white',
        badge: 'text-slate-500',
        iconWrap: 'bg-slate-100 text-slate-500',
        Icon: FiUsers,
      };
    default:
      return {
        shell: 'border-amber-200/80 bg-gradient-to-br from-amber-50/80 via-white to-white',
        badge: 'text-amber-700',
        iconWrap: 'bg-amber-100 text-amber-600',
        Icon: FiClock,
      };
  }
}

export function ProjectTodayAttendanceCard({
  project,
  projectId,
  presentCount,
  missingCount,
  totalCount,
}: Props) {
  const strings = useRegistryStrings('components/project/ProjectTodayAttendanceCard');
  const state = resolveState(totalCount, presentCount, missingCount);
  const style = stateStyle(state);
  const StateIcon = style.Icon;

  const formatTime = (t: string | null | undefined) => (t ? t.slice(0, 5) : '—');

  const title =
    state === 'all'
      ? strings.allPresent
      : state === 'partial'
        ? strings.partial
        : state === 'empty'
          ? strings.empty
          : strings.pending;

  const hint =
    state === 'all'
      ? formatString(strings.hintAll, { present: presentCount })
      : state === 'partial'
        ? formatString(strings.hintPartial, { present: presentCount, missing: missingCount })
        : state === 'empty'
          ? strings.hintEmpty
          : strings.hintPending;

  const showScan = state === 'pending' || state === 'partial';

  return (
    <section
      aria-label={strings.badge}
      className={`relative overflow-hidden rounded-2xl border shadow-sm sm:rounded-3xl ${style.shell}`}
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className={`text-[11px] font-bold uppercase tracking-wider ${style.badge}`}>
              {strings.badge}
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-900">{project.name}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {formatString(strings.shiftHours, {
                start: formatTime(project.work_start_time),
                end: project.work_end_time
                  ? formatString(strings.shiftEnd, { end: formatTime(project.work_end_time) })
                  : '',
              })}
            </p>
          </div>
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${style.iconWrap}`}
          >
            <StateIcon className="h-5 w-5" aria-hidden />
          </span>
        </div>

        <p className="mt-3 text-base font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">{hint}</p>

        {showScan ? (
          <Link
            href={`/admin-panel/proje/${projectId}/yevmiye`}
            className="mt-4 flex w-full touch-target items-center justify-center gap-2.5 rounded-2xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-700 active:bg-blue-800"
          >
            <TbQrcode className="h-5 w-5" aria-hidden />
            {strings.scanQr}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
