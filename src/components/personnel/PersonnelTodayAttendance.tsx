'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { FiCheckCircle, FiClock } from 'react-icons/fi';
import { TbQrcode } from 'react-icons/tb';
import { formatWorkLogSummary } from '@/lib/work-log';
import { fetchPersonnelTodayAttendance } from '@/lib/personnel-api';
import { formatString } from '@/lib/strings/format';
import strings from '@json/src/components/personnel/PersonnelTodayAttendance.json';

export function PersonnelTodayAttendance() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('none');
  const [workLog, setWorkLog] = useState<{ amount: number; mesai_type: string } | null>(null);
  const [project, setProject] = useState<{
    name: string;
    workStartTime: string | null;
    workEndTime: string | null;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPersonnelTodayAttendance();
      setStatus(data.status);
      setWorkLog(data.workLog);
      setProject(data.project);
    } catch (e) {
      setError(e instanceof Error ? e.message : strings.loadFailed);
    } finally {
      setLoading(false);
    }
  }, []);

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

  const isConfirmed = status === 'confirmed';

  return (
    <div
      className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border shadow-sm ${
        isConfirmed
          ? 'border-emerald-200/80 dark:border-emerald-800/50 bg-gradient-to-br from-emerald-50/90 via-white to-white dark:from-emerald-950/20 dark:via-slate-800 dark:to-slate-900'
          : 'border-amber-200/80 dark:border-amber-900/40 bg-gradient-to-br from-amber-50/80 via-white to-white dark:from-amber-950/15 dark:via-slate-800 dark:to-slate-900'
      }`}
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p
              className={`text-[11px] font-bold uppercase tracking-wider ${
                isConfirmed
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-amber-700 dark:text-amber-400'
              }`}
            >
              {strings.badge}
            </p>
            {project?.name && (
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white truncate">
                {project.name}
              </p>
            )}
            {project && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {formatString(strings.shiftHours, {
                  start: formatTime(project.workStartTime),
                  end: project.workEndTime
                    ? formatString(strings.shiftEnd, { end: formatTime(project.workEndTime) })
                    : '',
                })}
              </p>
            )}
          </div>
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
              isConfirmed
                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
                : 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'
            }`}
          >
            {isConfirmed ? (
              <FiCheckCircle className="w-5 h-5" />
            ) : (
              <FiClock className="w-5 h-5" />
            )}
          </span>
        </div>

        <p className="mt-3 text-base font-semibold text-slate-900 dark:text-white">
          {isConfirmed ? strings.confirmed : strings.notConfirmed}
        </p>

        {workLog && (
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {formatWorkLogSummary(workLog.amount, workLog.mesai_type)}
          </p>
        )}

        {error && <p className="text-xs text-red-600 dark:text-red-400 mt-2">{error}</p>}

        {!isConfirmed && (
          <Link
            href="/personnel-panel/yoklama"
            className="mt-4 w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold shadow-lg shadow-blue-600/20 touch-target transition-colors"
          >
            <TbQrcode className="w-5 h-5" />
            {strings.scanQr}
          </Link>
        )}
      </div>
    </div>
  );
}
