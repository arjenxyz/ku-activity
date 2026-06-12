'use client';

import { FiClock } from 'react-icons/fi';
import { mesaiLabel } from '@/lib/work-log';
import type { WorkLog } from '@/lib/personnel-stats';

type Props = {
  workLogs: WorkLog[];
};

export function PersonnelMesaiSummary({ workLogs }: Props) {
  const withMesai = workLogs.filter((w) => w.mesai_type && w.mesai_type !== 'none');
  const counts: Record<string, number> = { ceyrek: 0, yarim: 0, tam: 0 };

  for (const log of withMesai) {
    const key = String(log.mesai_type);
    if (key in counts) counts[key] += 1;
  }

  const totalMesaiDays = withMesai.length;
  const halfDays = workLogs.filter((w) => Number(w.amount) === 0.5).length;
  const fullDays = workLogs.filter((w) => Number(w.amount) === 1).length;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-5 shadow-sm h-full">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
        <FiClock className="w-4 h-4" />
        Dönem çalışma özeti
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 dark:bg-slate-900/50 px-3 py-2.5">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{fullDays}</p>
          <p className="text-xs text-slate-500">Tam gün</p>
        </div>
        <div className="rounded-xl bg-slate-50 dark:bg-slate-900/50 px-3 py-2.5">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{halfDays}</p>
          <p className="text-xs text-slate-500">Yarım gün</p>
        </div>
      </div>
      {totalMesaiDays > 0 ? (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
            Mesai ({totalMesaiDays} kayıt)
          </p>
          <ul className="space-y-1.5">
            {(['ceyrek', 'yarim', 'tam'] as const).map((type) =>
              counts[type] > 0 ? (
                <li
                  key={type}
                  className="flex justify-between text-sm text-slate-700 dark:text-slate-300"
                >
                  <span>{mesaiLabel(type)}</span>
                  <span className="font-medium">{counts[type]} gün</span>
                </li>
              ) : null
            )}
          </ul>
        </div>
      ) : (
        <p className="text-xs text-slate-500 mt-3">Bu dönemde mesai kaydı yok.</p>
      )}
    </div>
  );
}
