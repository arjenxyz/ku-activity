'use client';

import { FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { formatDate } from '@/lib/format';
import { formatWorkLogSummary, getWorkLogApprovalStatus } from '@/lib/work-log';
import type { WorkLog } from '@/lib/personnel-stats';
import { confirmPersonnelAttendance } from '@/lib/personnel-api';
import { useState } from 'react';

type Props = {
  workLogs: WorkLog[];
  onConfirmed?: () => void;
};

export function PersonnelPendingApprovals({ workLogs, onConfirmed }: Props) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pending = workLogs.filter(
    (log) => getWorkLogApprovalStatus(log) === 'pending_employee'
  );

  if (pending.length === 0) return null;

  const handleConfirm = async (log: WorkLog) => {
    setConfirmingId(log.id);
    setError(null);
    try {
      await confirmPersonnelAttendance(log.date);
      onConfirmed?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Onay kaydedilemedi');
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/80 dark:bg-amber-950/30 p-4 sm:p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <FiAlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
            Onayınızı bekleyen {pending.length} yevmiye kaydı
          </p>
          <p className="text-xs text-amber-800/80 dark:text-amber-200/80 mt-1">
            Yönetici tarafından girilen günleri onaylayın; aksi halde ödeme hesabına dahil edilmez.
          </p>
          {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
          <ul className="mt-4 space-y-2">
            {pending.map((log) => (
              <li
                key={log.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-100 dark:border-amber-900/40 px-3 py-2.5"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {formatDate(log.date)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatWorkLogSummary(Number(log.amount), log.mesai_type ?? null)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleConfirm(log)}
                  disabled={confirmingId === log.id}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold disabled:opacity-50 shrink-0"
                >
                  <FiCheckCircle className="w-3.5 h-3.5" />
                  {confirmingId === log.id ? 'Kaydediliyor…' : 'Onayla'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
