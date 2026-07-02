'use client';

import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import { FiCalendar } from 'react-icons/fi';

dayjs.locale('tr');

type Props = {
  month: string;
  onChange: (month: string) => void;
};

export function PersonnelMonthChip({ month, onChange }: Props) {
  const label = dayjs(`${month}-01`).format('MMMM YYYY');

  return (
    <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm shadow-sm cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
      <FiCalendar className="w-4 h-4 text-blue-600 shrink-0" />
      <span className="font-medium text-slate-700 dark:text-slate-200 capitalize">{label}</span>
      <input
        type="month"
        value={month}
        max={dayjs().format('YYYY-MM')}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
        aria-label="Dönem seçin"
      />
    </label>
  );
}
