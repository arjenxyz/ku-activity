'use client';

import { useCallback, useEffect, useState } from 'react';
import type { MinimumWage } from '@/lib/personnel-stats';
import type { AsgariProrationMode, YevmiyePaymentTrigger } from '@/types/wage-policy';

export type PersonnelAsgariSummary = {
  month: string;
  hireDate: string | null;
  policyConfigured: boolean;
  note?: string;
  policy: {
    yevmiyePaymentTriggers: YevmiyePaymentTrigger[];
    yevmiyePaymentNotes: string;
    prorationFromHireDate: boolean;
    prorationMode: AsgariProrationMode;
    referenceMonthly: number;
  };
  earnings: {
    approvedGross: number;
    approvedDays: number;
    minimumPaid: number;
  };
  gap: {
    eligibleMinimum: number;
    remainingGap: number;
    isBelowMinimum: boolean;
    paymentStatus: 'complete' | 'partial' | 'open' | 'none';
  };
  records: MinimumWage[];
};

export function usePersonnelAsgari(month: string, enabled = true) {
  const [data, setData] = useState<PersonnelAsgariSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/personnel/asgari?month=${encodeURIComponent(month)}`, {
        credentials: 'same-origin',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error || 'Asgari verisi yüklenemedi');
      }
      const json = (await res.json()) as PersonnelAsgariSummary;
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yüklenemedi');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [month, enabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}
