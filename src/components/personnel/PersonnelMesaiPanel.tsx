'use client';

import { useMemo, useState } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import type { WorkLog } from '@/lib/personnel-stats';
import { buildMesaiCalendar, computeMesaiStats } from '@/lib/personnel-stats';
import { PersonnelMesaiCalendar } from './PersonnelMesaiCalendar';
import { PersonnelCalendarDayModal } from './PersonnelCalendarDayModal';

type Props = {
  month: string;
  onMonthChange: (month: string) => void;
  workLogs: WorkLog[];
  dailyWage: number;
};

export function PersonnelMesaiPanel({ month, onMonthChange, workLogs, dailyWage }: Props) {
  const strings = useRegistryStrings('components/personnel/PersonnelMesaiPanel');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const mesaiStats = useMemo(() => computeMesaiStats(workLogs, dailyWage), [workLogs, dailyWage]);
  const calendarDays = useMemo(
    () => buildMesaiCalendar(month, workLogs, dailyWage),
    [month, workLogs, dailyWage]
  );

  const selectedLog = selectedDate ? workLogs.find((log) => log.date === selectedDate) ?? null : null;

  return (
    <>
      <PersonnelMesaiCalendar
        month={month}
        onMonthChange={onMonthChange}
        days={calendarDays}
        totalPay={mesaiStats.totalPay}
        onDaySelect={setSelectedDate}
      />
      {mesaiStats.recordCount === 0 ? (
        <p className="text-sm text-center text-slate-500 dark:text-slate-400 py-2">{strings.emptyRecords}</p>
      ) : null}
      <PersonnelCalendarDayModal
        open={Boolean(selectedDate)}
        date={selectedDate}
        mode="mesai"
        workLog={selectedLog}
        deductions={[]}
        minimumWages={[]}
        dailyWage={dailyWage}
        onClose={() => setSelectedDate(null)}
      />
    </>
  );
}
