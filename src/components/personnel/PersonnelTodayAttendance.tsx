'use client';

import { useCallback, useEffect, useState } from 'react';
import type { IconType } from 'react-icons';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import dayjs from 'dayjs';
import { FiAlertCircle, FiCheckCircle, FiClock, FiUserMinus } from 'react-icons/fi';
import { TbQrcode } from 'react-icons/tb';
import { formatWorkLogSummary } from '@/lib/work-log';
import {
  fetchPersonnelAttendanceStatus,
  fetchPersonnelTodayAttendance,
  type PersonnelAttendanceStatusPayload,
} from '@/lib/personnel-api';
import { formatString } from '@/lib/strings/format';
import { getRegistryStrings } from '@/lib/i18n/strings-registry';
import { personnelHref } from '@/lib/demo/demo-paths';

type TodayStrings = ReturnType<
  typeof getRegistryStrings<'components/personnel/PersonnelTodayAttendance'>
>;

type CardVisualState = 'confirmed' | 'waiting' | 'cancelled' | 'removed' | 'none';

type StateStyle = {
  shell: string;
  badge: string;
  iconWrap: string;
  Icon: IconType;
};

function resolveVisualState(
  workLogStatus: string,
  attendance: PersonnelAttendanceStatusPayload | null
): CardVisualState {
  if (attendance?.state === 'cancelled') return 'cancelled';
  if (attendance?.state === 'removed') return 'removed';
  if (workLogStatus === 'confirmed' || attendance?.state === 'completed') return 'confirmed';
  if (attendance?.state === 'waiting') return 'waiting';
  return 'none';
}

function stateStyle(state: CardVisualState): StateStyle {
  switch (state) {
    case 'confirmed':
      return {
        shell:
          'border-emerald-200/80 dark:border-emerald-800/50 bg-gradient-to-br from-emerald-50/90 via-white to-white dark:from-emerald-950/20 dark:via-slate-800 dark:to-slate-900',
        badge: 'text-emerald-700 dark:text-emerald-400',
        iconWrap: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
        Icon: FiCheckCircle,
      };
    case 'waiting':
      return {
        shell:
          'border-sky-200/80 dark:border-sky-800/50 bg-gradient-to-br from-sky-50/90 via-white to-white dark:from-sky-950/20 dark:via-slate-800 dark:to-slate-900',
        badge: 'text-sky-700 dark:text-sky-400',
        iconWrap: 'bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400',
        Icon: FiClock,
      };
    case 'cancelled':
      return {
        shell:
          'border-amber-200/80 dark:border-amber-900/40 bg-gradient-to-br from-amber-50/90 via-white to-white dark:from-amber-950/15 dark:via-slate-800 dark:to-slate-900',
        badge: 'text-amber-700 dark:text-amber-400',
        iconWrap: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
        Icon: FiAlertCircle,
      };
    case 'removed':
      return {
        shell:
          'border-rose-200/80 dark:border-rose-900/40 bg-gradient-to-br from-rose-50/90 via-white to-white dark:from-rose-950/15 dark:via-slate-800 dark:to-slate-900',
        badge: 'text-rose-700 dark:text-rose-400',
        iconWrap: 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400',
        Icon: FiUserMinus,
      };
    default:
      return {
        shell:
          'border-amber-200/80 dark:border-amber-900/40 bg-gradient-to-br from-amber-50/80 via-white to-white dark:from-amber-950/15 dark:via-slate-800 dark:to-slate-900',
        badge: 'text-amber-700 dark:text-amber-400',
        iconWrap: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
        Icon: FiClock,
      };
  }
}

function resolveCopy(
  state: CardVisualState,
  strings: TodayStrings,
  attendance: PersonnelAttendanceStatusPayload | null
) {
  switch (state) {
    case 'confirmed':
      return { title: strings.confirmed, hint: null as string | null };
    case 'waiting':
      return {
        title: strings.states.waiting.title,
        hint: attendance?.message ?? strings.states.waiting.hint,
      };
    case 'cancelled':
      return {
        title: strings.states.cancelled.title,
        hint: attendance?.message ?? strings.states.cancelled.hint,
      };
    case 'removed':
      return {
        title: strings.states.removed.title,
        hint: attendance?.message ?? strings.states.removed.hint,
      };
    default:
      return { title: strings.notConfirmed, hint: null as string | null };
  }
}

export function PersonnelTodayAttendance() {
  const strings = useRegistryStrings('components/personnel/PersonnelTodayAttendance');
  const pathname = usePathname() ?? '';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workLogStatus, setWorkLogStatus] = useState<string>('none');
  const [workLog, setWorkLog] = useState<{ amount: number; mesai_type: string } | null>(null);
  const [attendance, setAttendance] = useState<PersonnelAttendanceStatusPayload | null>(null);
  const [project, setProject] = useState<{
    name: string;
    workStartTime: string | null;
    workEndTime: string | null;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const today = dayjs().format('YYYY-MM-DD');
      const [todayData, attendanceData] = await Promise.all([
        fetchPersonnelTodayAttendance(),
        fetchPersonnelAttendanceStatus(today),
      ]);
      setWorkLogStatus(todayData.status);
      setWorkLog(todayData.workLog);
      setProject(todayData.project);
      setAttendance(attendanceData);
    } catch (e) {
      setError(e instanceof Error ? e.message : strings.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [strings.loadFailed]);

  useEffect(() => {
    void load();
  }, [load]);

  const formatTime = (t: string | null | undefined) => (t ? t.slice(0, 5) : '—');

  if (loading) {
    return (
      <div className="rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 animate-pulse">
        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="mt-4 h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="mt-6 h-11 bg-slate-200 dark:bg-slate-700 rounded-xl" />
      </div>
    );
  }

  const visualState = resolveVisualState(workLogStatus, attendance);
  const style = stateStyle(visualState);
  const copy = resolveCopy(visualState, strings, attendance);
  const showWorkLogSummary = visualState === 'confirmed' && workLog;
  const showScanAction = visualState === 'none' || visualState === 'cancelled' || visualState === 'removed';
  const scanLabel = visualState === 'none' ? strings.scanQr : strings.rescanQr;
  const StateIcon = style.Icon;

  return (
    <section
      aria-label={strings.badge}
      className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border shadow-sm ${style.shell}`}
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className={`text-[11px] font-bold uppercase tracking-wider ${style.badge}`}>{strings.badge}</p>
            {project?.name ? (
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white truncate">{project.name}</p>
            ) : null}
            {project ? (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {formatString(strings.shiftHours, {
                  start: formatTime(project.workStartTime),
                  end: project.workEndTime
                    ? formatString(strings.shiftEnd, { end: formatTime(project.workEndTime) })
                    : '',
                })}
              </p>
            ) : null}
          </div>
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${style.iconWrap}`}
          >
            <StateIcon className="h-5 w-5" aria-hidden />
          </span>
        </div>

        <p className="mt-3 text-base font-semibold text-slate-900 dark:text-white">{copy.title}</p>

        {copy.hint ? (
          <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{copy.hint}</p>
        ) : null}

        {showWorkLogSummary && workLog ? (
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {formatWorkLogSummary(workLog.amount, workLog.mesai_type)}
          </p>
        ) : null}

        {error ? <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p> : null}

        {showScanAction ? (
          <Link
            href={personnelHref(pathname, '/personnel-panel/yoklama')}
            className="mt-4 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-700 active:bg-blue-800 touch-target"
          >
            <TbQrcode className="h-5 w-5" aria-hidden />
            {scanLabel}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
