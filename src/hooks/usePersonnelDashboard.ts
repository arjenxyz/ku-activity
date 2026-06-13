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

type Options = {
  loadFinance?: boolean;
};

export function usePersonnelDashboard(month: string, options: Options = {}) {
  const { loadFinance = true } = options;
  const router = useRouter();
  const [employee, setEmployee] = useState<PersonnelEmployee | null>(null);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [deductions, setDeductions] = useState<Deduction[]>([]);
  const [minimumWages, setMinimumWages] = useState<MinimumWage[]>([]);
  const [monthStats, setMonthStats] = useState<MonthStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [financeLoading, setFinanceLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reloadCore = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let me: PersonnelEmployee | null = null;
      let lastErr: unknown;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          me = await fetchPersonnelMe();
          break;
        } catch (e) {
          lastErr = e;
          const msg = e instanceof Error ? e.message : '';
          const authFailure = msg.includes('Oturum') || msg.includes('401') || msg.includes('geçersiz');
          if (attempt === 0 && authFailure) {
            await new Promise((r) => setTimeout(r, 400));
            continue;
          }
          throw e;
        }
      }
      if (!me) throw lastErr ?? new Error('Oturum geçersiz');
      setEmployee(me);
      const wl = await fetchPersonnelWorkLogs(month);
      setWorkLogs(wl);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Veri yüklenemedi';
      if (msg.includes('Oturum') || msg.includes('401') || msg.includes('geçersiz')) {
        router.replace('/personnel-panel/login');
        return;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [month, router]);

  const reloadFinance = useCallback(async () => {
    if (!loadFinance) return;
    setFinanceLoading(true);
    try {
      const [ded, min, stats] = await Promise.all([
        fetchPersonnelDeductions(month),
        fetchPersonnelMinimumWages(month).catch(() => [] as MinimumWage[]),
        fetchPersonnelMonthStats(month).catch(() => null),
      ]);
      setDeductions(ded);
      setMinimumWages(min);
      setMonthStats(stats);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Finans verisi yüklenemedi';
      setError(msg);
    } finally {
      setFinanceLoading(false);
    }
  }, [loadFinance, month]);

  const reload = useCallback(async () => {
    await reloadCore();
    await reloadFinance();
  }, [reloadCore, reloadFinance]);

  useEffect(() => {
    void reloadCore();
  }, [reloadCore]);

  useEffect(() => {
    void reloadFinance();
  }, [reloadFinance]);

  const safeNum = (v: number) => (Number.isFinite(v) ? v : 0);

  const stats = employee
    ? monthStats
      ? {
          workDays: safeNum(monthStats.work_days),
          approvedDays: safeNum(monthStats.approved_days),
          pendingDays: safeNum(monthStats.pending_days),
          mesaiUnits: safeNum(monthStats.mesai_units),
          mesaiPay: safeNum(monthStats.mesai_pay),
          basePay: safeNum(monthStats.base_pay),
          gross: safeNum(monthStats.gross_pay),
          totalAdvance: safeNum(monthStats.total_advances),
          totalDeduct: safeNum(monthStats.total_deductions),
          totalMinimum: safeNum(monthStats.total_minimum),
          net: safeNum(monthStats.net_pay),
        }
      : loadFinance
        ? computePersonnelStats(workLogs, deductions, Number(employee.daily_wage), minimumWages)
        : computePersonnelStats(workLogs, [], Number(employee.daily_wage), [])
    : null;

  return {
    employee,
    workLogs,
    deductions,
    minimumWages,
    stats,
    loading: loading || (loadFinance && financeLoading && !monthStats && deductions.length === 0),
    financeLoading,
    error,
    reload,
  };
}
