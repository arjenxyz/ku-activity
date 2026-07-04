'use client';

import { formatMoney } from '@/lib/format';
import { profitMarginPercent } from '@/lib/profit-display';
import type { ProjectProfitOverview } from '@/types/project-job';
import { cardClass } from '@/components/project/ui';
import { formatString } from '@/lib/strings/format';
import strings from '@json/src/components/project/profit/ProfitTotalsStrip.json';

type Props = {
  overview: ProjectProfitOverview;
};

export function ProfitTotalsStrip({ overview }: Props) {
  const { totals } = overview;
  const margin = profitMarginPercent(totals.profitApproved, totals.contractTotal);
  const jobCount = overview.jobs.length;
  const activeCount = overview.jobs.filter((j) => j.job.status === 'active').length;

  const cells = [
    {
      label: strings.cells.receivable,
      value: formatMoney(totals.contractTotal),
      sub: formatString(strings.jobCount, { count: jobCount }),
      accent: 'text-slate-900',
    },
    {
      label: strings.cells.expense,
      value: formatMoney(totals.totalCostApproved),
      sub: formatString(strings.laborCost, { amount: formatMoney(totals.laborCostApproved) }),
      accent: 'text-amber-700',
    },
    {
      label: strings.cells.profit,
      value: formatMoney(totals.profitApproved),
      sub: margin > 0 ? formatString(strings.margin, { margin }) : strings.emptyValue,
      accent: totals.profitApproved >= 0 ? 'text-emerald-700' : 'text-red-600',
      highlight: true,
    },
    {
      label: strings.cells.perShare,
      value: formatMoney(totals.profitPerShareApproved),
      sub: formatString(strings.shareSummary, { shareCount: totals.shareCount, activeCount }),
      accent: 'text-slate-900',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cells.map((cell) => (
        <div
          key={cell.label}
          className={`${cardClass} p-4 ${cell.highlight ? 'ring-2 ring-emerald-500/30 bg-emerald-50/40' : ''}`}
        >
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{cell.label}</p>
          <p className={`text-xl sm:text-2xl font-bold mt-1 ${cell.accent}`}>{cell.value}</p>
          <p className="text-xs text-slate-500 mt-1">{cell.sub}</p>
        </div>
      ))}
    </div>
  );
}
