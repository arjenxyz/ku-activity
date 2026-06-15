'use client';

import { formatMoney } from '@/lib/format';
import { profitMarginPercent } from '@/lib/profit-display';
import type { ProjectProfitOverview } from '@/types/project-job';
import { cardClass } from '@/components/project/ui';

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
      label: 'Toplam alacak',
      value: formatMoney(totals.contractTotal),
      sub: `${jobCount} iş kalemi`,
      accent: 'text-slate-900',
    },
    {
      label: 'Toplam gider',
      value: formatMoney(totals.totalCostApproved),
      sub: `Yevmiye ${formatMoney(totals.laborCostApproved)}`,
      accent: 'text-amber-700',
    },
    {
      label: 'Net kâr',
      value: formatMoney(totals.profitApproved),
      sub: margin > 0 ? `%${margin} marj` : '—',
      accent: totals.profitApproved >= 0 ? 'text-emerald-700' : 'text-red-600',
      highlight: true,
    },
    {
      label: 'Ortak başı',
      value: formatMoney(totals.profitPerShareApproved),
      sub: `${totals.shareCount} kişi · ${activeCount} aktif iş`,
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
