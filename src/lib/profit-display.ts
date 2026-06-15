import { formatMoney } from '@/lib/format';
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
  const lines: WaterfallLine[] = [
    {
      id: 'contract',
      label: 'Üst taşerondan alacak',
      amount: item.contractTotal,
      tone: 'income',
      hint: `${item.job.unit_price} ₺/${item.job.unit_label} × ${item.job.quantity} ${item.job.unit_label}`,
    },
  ];

  if (item.laborCostApproved > 0 || item.approvedWorkDays > 0) {
    lines.push({
      id: 'labor',
      label: 'İşçi yevmiyesi (onaylı)',
      amount: -item.laborCostApproved,
      tone: 'cost',
      hint: `${item.approvedWorkDays} onaylı gün`,
    });
  }
  if (item.advancesCost > 0) {
    lines.push({
      id: 'advance',
      label: 'Avanslar',
      amount: -item.advancesCost,
      tone: 'cost',
      hint: 'Bu işe bağlı avans kayıtları',
    });
  }
  if (item.deductionsCost > 0) {
    lines.push({
      id: 'deduction',
      label: 'Kesintiler',
      amount: -item.deductionsCost,
      tone: 'cost',
    });
  }
  if (item.materialCost > 0) {
    lines.push({
      id: 'material',
      label: 'Malzeme gideri',
      amount: -item.materialCost,
      tone: 'cost',
      hint: `${item.expenses.length} kayıt`,
    });
  }

  lines.push({
    id: 'profit',
    label: 'Net kâr',
    amount: item.profitApproved,
    tone: 'total',
  });

  if (item.shareCount > 1) {
    lines.push({
      id: 'share',
      label: `Ortak başı (${item.shareCount} kişi)`,
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
