'use client';

import { FiClock, FiTrendingUp } from 'react-icons/fi';
import type { WorkLog } from '@/lib/personnel-stats';
import {
  buildMesaiCalendar,
  computeMesaiStats,
  mesaiPayForLog,
} from '@/lib/personnel-stats';
import { formatDate, formatMoney } from '@/lib/format';
import { approvalStatusLabel, mesaiLabel } from '@/lib/work-log';
import { getWorkLogApprovalStatus } from '@/lib/work-log';
import { PersonnelMesaiCalendar } from './PersonnelMesaiCalendar';
import { PersonnelSection } from './PersonnelRecordCard';
import { PersonnelStatGrid } from './PersonnelStatGrid';

type Props = {
  month: string;
  onMonthChange: (month: string) => void;
  workLogs: WorkLog[];
  dailyWage: number;
};

export function PersonnelMesaiPanel({ month, onMonthChange, workLogs, dailyWage }: Props) {
  const mesaiStats = computeMesaiStats(workLogs, dailyWage);
  const calendarDays = buildMesaiCalendar(month, workLogs, dailyWage);

  const statItems = [
    {
      label: 'Toplam Mesai Kazancı',
      value: formatMoney(mesaiStats.totalPay),
      icon: <FiTrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />,
      accent: 'bg-orange-50 dark:bg-orange-900/30',
    },
    {
      label: 'Mesai Kaydı',
      value: mesaiStats.recordCount.toString(),
      icon: <FiClock className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      accent: 'bg-amber-50 dark:bg-amber-900/30',
    },
  ];

  return (
    <div className="space-y-6">
      <PersonnelMesaiCalendar
        month={month}
        onMonthChange={onMonthChange}
        days={calendarDays}
        totalPay={mesaiStats.totalPay}
      />

      <PersonnelStatGrid items={statItems} />

      {mesaiStats.recordCount > 0 && (
        <div className="rounded-2xl border border-orange-100 dark:border-orange-900/40 bg-white dark:bg-slate-800 p-4 sm:p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Mesai türüne göre kazanç
          </p>
          <ul className="space-y-2">
            {(['ceyrek', 'yarim', 'tam'] as const).map((type) => {
              const row = mesaiStats.byType[type];
              if (row.count === 0) return null;
              return (
                <li
                  key={type}
                  className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300"
                >
                  <span>
                    {mesaiLabel(type)}{' '}
                    <span className="text-gray-400">({row.count} kayıt)</span>
                  </span>
                  <span className="font-semibold tabular-nums text-orange-700 dark:text-orange-300">
                    {formatMoney(row.pay)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <PersonnelSection
        title={`Mesai Kayıtları · ${new Date(`${month}-01T12:00:00`).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}`}
        icon={<FiClock className="w-5 h-5 text-orange-600" />}
        isEmpty={mesaiStats.logs.length === 0}
        emptyMessage="Bu dönemde mesai kaydı yok"
      >
        <div>
          {mesaiStats.logs.map((log) => {
            const status = getWorkLogApprovalStatus(log);
            const pay = mesaiPayForLog(log, dailyWage);
            return (
              <div
                key={log.id}
                className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-gray-100 dark:border-slate-700 last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDate(log.date)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {mesaiLabel(log.mesai_type)} · {approvalStatusLabel(status)}
                  </p>
                </div>
                <p className="text-sm font-bold tabular-nums text-orange-700 dark:text-orange-300 shrink-0">
                  {formatMoney(pay)}
                </p>
              </div>
            );
          })}
        </div>
      </PersonnelSection>
    </div>
  );
}
