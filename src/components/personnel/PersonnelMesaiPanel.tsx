'use client';

import { PersonnelUnifiedCalendarPanel } from '@/components/personnel/PersonnelUnifiedCalendarPanel';
import type { WorkLog } from '@/lib/personnel-stats';

type Props = {
  month: string;
  onMonthChange: (month: string) => void;
  workLogs: WorkLog[];
  dailyWage: number;
};

/** @deprecated Use PersonnelUnifiedCalendarPanel */
export function PersonnelMesaiPanel({ deductions: _d, minimumWages: _m, ...props }: Props & {
  deductions?: never;
  minimumWages?: never;
}) {
  return (
    <PersonnelUnifiedCalendarPanel
      {...props}
      deductions={[]}
      minimumWages={[]}
    />
  );
}
