'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  fetchPersonnelDeductions,
  fetchPersonnelMe,
  fetchPersonnelMinimumWages,
  fetchPersonnelMonthStats,
  fetchPersonnelWorkLogs,
  type MonthStats,
  type PersonnelEmployee,
} from '@/lib/personnel-api';
import { computePersonnelStats, type Deduction, type MinimumWage, type WorkLog } from '@/lib/personnel-stats';

export function usePersonnelDashboard(month: string) {
  const router = useRouter();
  const [employee, setEmployee] = useState<PersonnelEmployee | null>(null);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [deductions, setDeductions] = useState<Deduction[]>([]);
  const [minimumWages, setMinimumWages] = useState<MinimumWage[]>([]);
  const [monthStats, setMonthStats] = useState<MonthStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const me = await fetchPersonnelMe();
      setEmployee(me);

      const [wl, ded, min, stats] = await Promise.all([
        fetchPersonnelWorkLogs(month),
        fetchPersonnelDeductions(month),
        fetchPersonnelMinimumWages(month).catch(() => [] as MinimumWage[]),
        fetchPersonnelMonthStats(month).catch(() => null),
      ]);

      setWorkLogs(wl);
      setDeductions(ded);
      setMinimumWages(min);
      setMonthStats(stats);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Veri yüklenemedi';
      if (msg.includes('Oturum') || msg.includes('401')) {
        router.replace('/personnel-panel/login');
        return;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [month, router]);

  useEffect(() => {
    reload();
  }, [reload]);

  const stats = employee
    ? monthStats
      ? {
          workDays: Number(monthStats.work_days),
          approvedDays: Number(monthStats.approved_days),
          pendingDays: Number(monthStats.pending_days),
          gross: Number(monthStats.gross_pay),
          totalAdvance: Number(monthStats.total_advances),
          totalDeduct: Number(monthStats.total_deductions),
          totalMinimum: Number(monthStats.total_minimum),
          net: Number(monthStats.net_pay),
        }
      : computePersonnelStats(workLogs, deductions, Number(employee.daily_wage), minimumWages)
    : null;

  return {
    employee,
    workLogs,
    deductions,
    minimumWages,
    stats,
    loading,
    error,
    reload,
  };
}
