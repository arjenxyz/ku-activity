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
export function PersonnelMesaiPanel(props: Props) {
  return (
    <PersonnelUnifiedCalendarPanel
      {...props}
      deductions={[]}
      minimumWages={[]}
    />
  );
}
