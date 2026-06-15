'use client';

import {
  barWidth,
  buildJobWaterfall,
  formatWaterfallAmount,
  type WaterfallLine,
} from '@/lib/profit-display';
import type { JobProfitSummary } from '@/types/project-job';

function WaterfallRow({
  line,
  contractTotal,
}: {
  line: WaterfallLine;
  contractTotal: number;
}) {
  const width = line.tone === 'income' || line.tone === 'cost' ? barWidth(line.amount, contractTotal) : 0;
  const isTotal = line.tone === 'total' || line.tone === 'share';

  return (
    <div
      className={`py-2 ${isTotal ? 'border-t border-slate-200 mt-1 pt-3' : ''}`}
    >
      <div className="flex items-start justify-between gap-3 text-sm">
        <div className="min-w-0 flex-1">
          <p
            className={`font-medium ${
              line.tone === 'income'
                ? 'text-emerald-800'
                : line.tone === 'cost'
                  ? 'text-slate-700'
                  : line.tone === 'total'
                    ? 'text-slate-900'
                    : 'text-indigo-800'
            }`}
          >
            {line.label}
          </p>
          {line.hint && <p className="text-xs text-slate-500 mt-0.5">{line.hint}</p>}
        </div>
        <p
          className={`font-semibold tabular-nums shrink-0 ${
            line.amount < 0 ? 'text-amber-700' : line.tone === 'total' ? 'text-emerald-700' : line.tone === 'share' ? 'text-indigo-700' : 'text-emerald-700'
          }`}
        >
          {formatWaterfallAmount(line)}
        </p>
      </div>
      {width > 0 && line.tone !== 'total' && line.tone !== 'share' && (
        <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full ${line.tone === 'income' ? 'bg-emerald-500' : 'bg-amber-400'}`}
            style={{ width: `${width}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function ProfitWaterfall({ item }: { item: JobProfitSummary }) {
  const lines = buildJobWaterfall(item);
  return (
    <div className="space-y-0">
      {lines.map((line) => (
        <WaterfallRow key={line.id} line={line} contractTotal={item.contractTotal} />
      ))}
    </div>
  );
}
