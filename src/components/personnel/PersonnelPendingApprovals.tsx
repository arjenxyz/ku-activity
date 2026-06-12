'use client';

import { FiAlertCircle } from 'react-icons/fi';
import type { WorkLog } from '@/lib/personnel-stats';
import { getWorkLogApprovalStatus } from '@/lib/work-log';
import { PersonnelWorkLogItem } from './PersonnelWorkLogItem';

type Props = {
  workLogs: WorkLog[];
  onConfirmed?: () => void;
};

export function PersonnelPendingApprovals({ workLogs, onConfirmed }: Props) {
  const pending = workLogs.filter(
    (log) => getWorkLogApprovalStatus(log) === 'pending_employee'
  );

  if (pending.length === 0) return null;

  return (
    <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/80 dark:bg-amber-950/30 p-4 sm:p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <FiAlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
            Onayınızı bekleyen {pending.length} yevmiye kaydı
          </p>
          <p className="text-xs text-amber-800/80 dark:text-amber-200/80 mt-1">
            Yönetici tarafından girilen günleri onaylayın veya hatalıysa itiraz edin.
          </p>
          <div className="mt-4 rounded-xl bg-white dark:bg-slate-900 border border-amber-100 dark:border-amber-900/40 overflow-hidden">
            {pending.map((log) => (
              <PersonnelWorkLogItem
                key={log.id}
                log={log}
                showActions
                onUpdated={onConfirmed}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
