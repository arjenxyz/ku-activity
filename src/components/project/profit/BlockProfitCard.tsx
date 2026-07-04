'use client';

import { formatMoney } from '@/lib/format';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import type { BlockProfitSummary } from '@/types/project-block';
import { PROJECT_BLOCK_STATUS_LABELS } from '@/types/project-block';
import { cardClass } from '@/components/project/ui';

type Props = {
  summary: BlockProfitSummary;
  expanded: boolean;
  onToggle: () => void;
};

export function BlockProfitCard({ summary, expanded, onToggle }: Props) {

  const strings = useRegistryStrings('components/project/profit/BlockProfitCard');
  const { block } = summary;
  const isActive = block.status === 'active';

  return (
    <div className={`${cardClass} overflow-hidden`}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left px-4 py-3 sm:px-5 sm:py-4 flex flex-wrap items-center gap-3 hover:bg-slate-50/80 transition-colors"
      >
        <div className="flex-1 min-w-[140px]">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900">{block.name}</h3>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                isActive
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {PROJECT_BLOCK_STATUS_LABELS[block.status]}
            </span>
          </div>
          {summary.teams.length > 0 && (
            <p className="text-xs text-slate-500 mt-0.5">
              {summary.teams.map((t) => t.name).join(', ')}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <p className="text-xs text-slate-500">{strings.stats.workLogs}</p>
            <p className="font-medium text-slate-800">{formatMoney(summary.laborCostApproved)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">{strings.stats.profit}</p>
            <p
              className={`font-semibold ${
                summary.profitApproved >= 0 ? 'text-emerald-700' : 'text-red-600'
              }`}
            >
              {formatMoney(summary.profitApproved)}
            </p>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-4 py-4 sm:px-5 space-y-4 bg-slate-50/50">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <Stat label={strings.stats.receivable} value={formatMoney(summary.contractTotal)} />
            <Stat label={strings.stats.laborApproved} value={formatMoney(summary.laborCostApproved)} />
            <Stat label={strings.stats.advance} value={formatMoney(summary.advancesCost)} />
            <Stat label={strings.stats.deduction} value={formatMoney(summary.deductionsCost)} />
            <Stat label={strings.stats.material} value={formatMoney(summary.materialCost)} />
            <Stat label={strings.stats.approvedDays} value={String(summary.approvedWorkDays)} />
            <Stat label={strings.stats.pendingDays} value={String(summary.pendingWorkDays)} />
            <Stat
              label={strings.stats.profitPerShare}
              value={formatMoney(summary.profitPerShare)}
              highlight={summary.profitApproved >= 0}
            />
          </div>

          {summary.jobs.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">{strings.jobsTitle}</p>
              <ul className="space-y-1">
                {summary.jobs.map((j) => (
                  <li
                    key={j.job.id}
                    className="flex justify-between text-sm bg-white rounded-lg px-3 py-2 border border-slate-100"
                  >
                    <span className="text-slate-700">{j.job.name}</span>
                    <span className="text-slate-500">{formatMoney(j.contractTotal)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`font-medium ${highlight ? 'text-emerald-700' : 'text-slate-800'}`}>{value}</p>
    </div>
  );
}
