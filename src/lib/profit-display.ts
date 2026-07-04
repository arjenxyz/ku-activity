import strings from '@json/src/lib/profit-display.json';
import { formatMoney } from '@/lib/format';
import { formatString } from '@/lib/strings/format';
import type { JobProfitSummary } from '@/types/project-job';

export function profitMarginPercent(profit: number, contractTotal: number): number {
  if (contractTotal <= 0) return 0;
  return Math.round((profit / contractTotal) * 100);
}

export type WaterfallLine = {
  id: string;
  label: string;
  amount: number;
  tone: 'income' | 'cost' | 'total' | 'share';
  hint?: string;
};

export function buildJobWaterfall(item: JobProfitSummary): WaterfallLine[] {
  const w = strings.waterfall;
  const lines: WaterfallLine[] = [
    {
      id: 'contract',
      label: w.contract.label,
      amount: item.contractTotal,
      tone: 'income',
      hint: formatString(w.contract.hint, {
        unitPrice: item.job.unit_price,
        unitLabel: item.job.unit_label,
        quantity: item.job.quantity,
      }),
    },
  ];

  if (item.laborCostApproved > 0 || item.approvedWorkDays > 0) {
    lines.push({
      id: 'labor',
      label: w.labor.label,
      amount: -item.laborCostApproved,
      tone: 'cost',
      hint: formatString(w.labor.hint, { approvedWorkDays: item.approvedWorkDays }),
    });
  }
  if (item.advancesCost > 0) {
    lines.push({
      id: 'advance',
      label: w.advance.label,
      amount: -item.advancesCost,
      tone: 'cost',
      hint: w.advance.hint,
    });
  }
  if (item.deductionsCost > 0) {
    lines.push({
      id: 'deduction',
      label: w.deduction.label,
      amount: -item.deductionsCost,
      tone: 'cost',
    });
  }
  if (item.materialCost > 0) {
    lines.push({
      id: 'material',
      label: w.material.label,
      amount: -item.materialCost,
      tone: 'cost',
      hint: formatString(w.material.hint, { expenseCount: item.expenses.length }),
    });
  }

  lines.push({
    id: 'profit',
    label: w.profit.label,
    amount: item.profitApproved,
    tone: 'total',
  });

  if (item.shareCount > 1) {
    lines.push({
      id: 'share',
      label: formatString(w.share.label, { shareCount: item.shareCount }),
      amount: item.profitPerShareApproved,
      tone: 'share',
    });
  }

  return lines;
}

export function barWidth(amount: number, contractTotal: number): number {
  if (contractTotal <= 0) return 0;
  return Math.min(100, Math.round((Math.abs(amount) / contractTotal) * 100));
}

export function formatWaterfallAmount(line: WaterfallLine): string {
  if (line.tone === 'cost') {
    return `− ${formatMoney(Math.abs(line.amount))}`;
  }
  return formatMoney(line.amount);
}
