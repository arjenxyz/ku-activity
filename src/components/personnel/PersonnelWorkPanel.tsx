'use client';

import { PersonnelUnifiedCalendarPanel } from '@/components/personnel/PersonnelUnifiedCalendarPanel';
import type { Deduction, MinimumWage, WorkLog } from '@/lib/personnel-stats';

type Props = {
  month: string;
  onMonthChange: (month: string) => void;
  workLogs: WorkLog[];
  deductions: Deduction[];
  minimumWages: MinimumWage[];
  dailyWage: number;
};

/** @deprecated Use PersonnelUnifiedCalendarPanel */
export function PersonnelWorkPanel(props: Props) {
  return <PersonnelUnifiedCalendarPanel {...props} />;
}
