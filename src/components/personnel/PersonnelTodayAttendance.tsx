'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { FiCheckCircle, FiClock, FiMaximize2 } from 'react-icons/fi';
import { formatWorkLogSummary } from '@/lib/work-log';
import { fetchPersonnelTodayAttendance } from '@/lib/personnel-api';

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
      setError(e instanceof Error ? e.message : 'Yüklenemedi');
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
      <div className="rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 animate-pulse h-28" />
    );
  }

  const isConfirmed = status === 'confirmed';

  return (
    <div className="rounded-2xl border border-blue-100 dark:border-blue-900/50 bg-gradient-to-br from-blue-50/80 to-white dark:from-slate-800 dark:to-slate-900 p-4 sm:p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            Bugünkü yoklama
          </p>
          {project && (
            <p className="text-xs text-slate-500 mt-0.5">
              İş başı {formatTime(project.workStartTime)}
              {project.workEndTime ? ` – ${formatTime(project.workEndTime)}` : ''}
            </p>
          )}
        </div>
        {isConfirmed ? (
          <FiCheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
        ) : (
          <FiClock className="w-6 h-6 text-amber-600 shrink-0" />
        )}
      </div>

        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 mt-3">
          {isConfirmed ? 'Bugün tam gün kayıtlısınız' : 'Yoklama bekleniyor'}
        </p>

      {workLog && (
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          {formatWorkLogSummary(workLog.amount, workLog.mesai_type)}
        </p>
      )}

      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

      {!isConfirmed && (
        <Link
          href="/personnel-panel/yoklama"
          className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
        >
          <FiMaximize2 className="w-4 h-4" />
          QR ile yoklama
        </Link>
      )}
    </div>
  );
}
