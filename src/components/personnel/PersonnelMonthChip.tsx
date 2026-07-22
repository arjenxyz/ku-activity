'use client';

import dayjs from 'dayjs';
import 'dayjs/locale/en';
import 'dayjs/locale/tr';
import { FiCalendar } from 'react-icons/fi';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { contentLocale } from '@/lib/i18n/locale';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';

type Props = {
  month: string;
  onChange: (month: string) => void;
  tone?: 'default' | 'onDark';
  className?: string;
};

export function PersonnelMonthChip({ month, onChange, tone = 'default', className = '' }: Props) {
  const strings = useRegistryStrings('components/personnel/PersonnelMonthChip');
  const { locale } = useLocale();
  const label = dayjs(`${month}-01`)
    .locale(contentLocale(locale))
    .format('MMMM YYYY');

  const shellClass =
    tone === 'onDark'
      ? 'border-white/20 bg-white/10 backdrop-blur-md hover:border-white/35 hover:bg-white/15'
      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-700';

  const iconClass = tone === 'onDark' ? 'text-blue-200' : 'text-blue-600';
  const textClass =
    tone === 'onDark'
      ? 'text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-50'
      : 'font-medium text-slate-700 dark:text-slate-200 capitalize';

  return (
    <label
      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 shadow-sm cursor-pointer transition-colors shrink-0 ${shellClass} ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <FiCalendar className={`w-4 h-4 shrink-0 ${iconClass}`} aria-hidden />
      <span className={textClass}>{label}</span>
      <input
        type="month"
        value={month}
        max={dayjs().format('YYYY-MM')}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
        aria-label={strings.periodAriaLabel}
      />
    </label>
  );
}
