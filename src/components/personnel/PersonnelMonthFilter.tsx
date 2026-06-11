'use client';

import dayjs from 'dayjs';
import { FiCalendar } from 'react-icons/fi';

export function PersonnelMonthFilter({
  month,
  onChange,
}: {
  month: string;
  onChange: (m: string) => void;
}) {
  const label = dayjs(`${month}-01`).format('MMMM YYYY');

  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
        <FiCalendar className="w-4 h-4 text-blue-600" />
        <span>
          Dönem: <strong className="text-gray-900 dark:text-white capitalize">{label}</strong>
        </span>
      </div>
      <input
        type="month"
        className="block w-full sm:w-auto rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        value={month}
        max={dayjs().format('YYYY-MM')}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
