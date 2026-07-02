'use client';

import dayjs from 'dayjs';
import { FiCalendar, FiChevronDown } from 'react-icons/fi';
import { EmployeeAvatar } from '@/components/employee/EmployeeAvatar';
import { formatMoney } from '@/lib/format';

type Props = {
  firstName?: string;
  fullName?: string;
  position?: string;
  photoUrl?: string | null;
  dailyWage?: number;
  month: string;
  onMonthChange: (month: string) => void;
};

export function PersonnelOverviewHeader({
  firstName,
  fullName,
  position,
  photoUrl,
  dailyWage,
  month,
  onMonthChange,
}: Props) {
  const monthLabel = dayjs(`${month}-01`).format('MMMM YYYY');
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Günaydın';
    if (h < 18) return 'İyi günler';
    return 'İyi akşamlar';
  })();

  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-indigo-600/8 dark:from-blue-500/10 dark:to-indigo-500/5 pointer-events-none" />

      <div className="relative p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {fullName && (
              <EmployeeAvatar
                name={fullName}
                photoUrl={photoUrl}
                size="lg"
                className="!rounded-2xl ring-2 ring-white dark:ring-slate-700 shadow-md shrink-0 hidden sm:flex"
              />
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                {greeting}
                {firstName ? `, ${firstName}` : ''}
              </p>
              <h2 className="mt-0.5 text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate">
                {fullName ?? 'Personel paneli'}
              </h2>
              {position && (
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{position}</p>
              )}
              {dailyWage != null && dailyWage > 0 && (
                <p className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  Günlük yevmiye {formatMoney(dailyWage)}
                </p>
              )}
            </div>
          </div>

          <label className="relative shrink-0 cursor-pointer group">
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/80 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 capitalize group-hover:border-blue-300 dark:group-hover:border-blue-700 transition-colors">
              <FiCalendar className="w-3.5 h-3.5 text-blue-600" />
              <span className="max-w-[7rem] sm:max-w-none truncate">{monthLabel}</span>
              <FiChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </span>
            <input
              type="month"
              value={month}
              max={dayjs().format('YYYY-MM')}
              onChange={(e) => onMonthChange(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer"
              aria-label="Dönem seçin"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
