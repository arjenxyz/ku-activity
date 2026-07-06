'use client';

import { useMemo, useState } from 'react';
import { PersonnelUnifiedCalendar } from '@/components/personnel/PersonnelUnifiedCalendar';
import { PersonnelCalendarDayModal } from '@/components/personnel/PersonnelCalendarDayModal';
import {
  buildUnifiedCalendar,
  computeMesaiStats,
  type Deduction,
  type MinimumWage,
  type WorkLog,
} from '@/lib/personnel-stats';

type Props = {
  month: string;
  onMonthChange: (month: string) => void;
  workLogs: WorkLog[];
  deductions: Deduction[];
  minimumWages: MinimumWage[];
  dailyWage: number;
};

export function PersonnelUnifiedCalendarPanel({
  month,
  onMonthChange,
  workLogs,
  deductions,
  minimumWages,
  dailyWage,
}: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const calendarDays = useMemo(
    () => buildUnifiedCalendar(month, workLogs, deductions, minimumWages, dailyWage),
    [month, workLogs, deductions, minimumWages, dailyWage]
  );

  const mesaiStats = useMemo(() => computeMesaiStats(workLogs, dailyWage), [workLogs, dailyWage]);

  const selectedLog = selectedDate ? workLogs.find((log) => log.date === selectedDate) ?? null : null;
  const selectedAdvances = selectedDate
    ? deductions.filter((item) => item.date === selectedDate && item.type === 'advance')
    : [];
  const selectedDeductions = selectedDate
    ? deductions.filter((item) => item.date === selectedDate && item.type !== 'advance')
    : [];
  const selectedMinimum = selectedDate
    ? minimumWages.filter((item) => item.date === selectedDate)
    : [];

  return (
    <>
      <PersonnelUnifiedCalendar
        month={month}
        onMonthChange={onMonthChange}
        days={calendarDays}
        totalMesaiPay={mesaiStats.totalPay}
        onDaySelect={setSelectedDate}
      />
      <PersonnelCalendarDayModal
        open={Boolean(selectedDate)}
        date={selectedDate}
        workLog={selectedLog}
        advances={selectedAdvances}
        otherDeductions={selectedDeductions}
        minimumWages={selectedMinimum}
        dailyWage={dailyWage}
        onClose={() => setSelectedDate(null)}
      />
    </>
  );
}
