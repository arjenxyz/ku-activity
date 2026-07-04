'use client';

import { useMemo, useState } from 'react';
import { PersonnelCalendar } from '@/components/personnel/PersonnelCalendar';
import { PersonnelCalendarDayModal } from '@/components/personnel/PersonnelCalendarDayModal';
import { buildMonthCalendar, type Deduction, type MinimumWage, type WorkLog } from '@/lib/personnel-stats';

type Props = {
  month: string;
  onMonthChange: (month: string) => void;
  workLogs: WorkLog[];
  deductions: Deduction[];
  minimumWages: MinimumWage[];
  dailyWage: number;
};

export function PersonnelWorkPanel({
  month,
  onMonthChange,
  workLogs,
  deductions,
  minimumWages,
  dailyWage,
}: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const calendarDays = useMemo(() => buildMonthCalendar(month, workLogs), [month, workLogs]);

  const selectedLog = selectedDate ? workLogs.find((log) => log.date === selectedDate) ?? null : null;
  const selectedDeductions = selectedDate
    ? deductions.filter((item) => item.date === selectedDate)
    : [];
  const selectedMinimum = selectedDate
    ? minimumWages.filter((item) => item.date === selectedDate)
    : [];

  return (
    <>
      <PersonnelCalendar
        month={month}
        onMonthChange={onMonthChange}
        days={calendarDays}
        onDaySelect={setSelectedDate}
      />
      <PersonnelCalendarDayModal
        open={Boolean(selectedDate)}
        date={selectedDate}
        mode="work"
        workLog={selectedLog}
        deductions={selectedDeductions}
        minimumWages={selectedMinimum}
        dailyWage={dailyWage}
        onClose={() => setSelectedDate(null)}
      />
    </>
  );
}
