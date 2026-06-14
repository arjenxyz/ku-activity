import dayjs from 'dayjs';
import {
  DEFAULT_WAGE_POLICY,
  normalizeWagePolicy,
  type WagePolicy,
} from '@/types/wage-policy';
import {
  computeMinimumWageGap,
  getOfficialMonthlyMinimumWageGross,
  type MinimumWageGapSummary,
} from '@/lib/minimum-wage';

export type ResolvedWagePolicy = WagePolicy & {
  source: 'company' | 'project' | 'default';
  useCompanyDefault: boolean;
};

export function mergeWagePolicies(
  company: WagePolicy | null,
  project: { policy: WagePolicy | null; useCompanyDefault: boolean } | null
): ResolvedWagePolicy {
  if (!project || project.useCompanyDefault) {
    const base = company ?? DEFAULT_WAGE_POLICY;
    return {
      ...base,
      source: company?.configuredAt ? 'company' : 'default',
      useCompanyDefault: true,
    };
  }
  return {
    ...(project.policy ?? DEFAULT_WAGE_POLICY),
    source: 'project',
    useCompanyDefault: false,
  };
}

export function getReferenceMinimumAmount(policy: WagePolicy): number {
  return policy.officialMonthlyMinimum ?? getOfficialMonthlyMinimumWageGross();
}

export function computeEligibleMinimumForPeriod(params: {
  month: string;
  hireDate?: string | null;
  policy: WagePolicy;
  workedDays?: number;
}): number {
  const base = getReferenceMinimumAmount(params.policy);
  const { month, hireDate, policy, workedDays = 0 } = params;

  if (policy.prorationMode === 'full_month') return base;
  if (!policy.prorationFromHireDate || !hireDate) return base;

  const monthStart = dayjs(`${month}-01`);
  const monthEnd = monthStart.endOf('month');
  const hire = dayjs(hireDate);

  if (hire.isAfter(monthEnd, 'day')) return 0;
  if (hire.isBefore(monthStart, 'day')) {
    if (policy.prorationMode === 'worked_days' && workedDays > 0) {
      const daily = base / monthStart.daysInMonth();
      return Math.round(daily * workedDays * 100) / 100;
    }
    return base;
  }

  if (policy.prorationMode === 'worked_days') {
    const daily = base / monthStart.daysInMonth();
    return Math.round(daily * workedDays * 100) / 100;
  }

  const eligibleDays = monthEnd.diff(hire, 'day') + 1;
  const daysInMonth = monthStart.daysInMonth();
  return Math.round((base / daysInMonth) * eligibleDays * 100) / 100;
}

export function computeMinimumWageGapWithPolicy(params: {
  month: string;
  hireDate?: string | null;
  grossEarned: number;
  minimumPaid?: number;
  workedDays?: number;
  policy: WagePolicy;
}): MinimumWageGapSummary & { eligibleMinimum: number } {
  const eligibleMinimum = computeEligibleMinimumForPeriod({
    month: params.month,
    hireDate: params.hireDate,
    policy: params.policy,
    workedDays: params.workedDays,
  });

  const gap = computeMinimumWageGap({
    grossEarned: params.grossEarned,
    minimumPaid: params.minimumPaid,
    officialGross: eligibleMinimum,
  });

  return { ...gap, eligibleMinimum };
}

export { normalizeWagePolicy };
