import type { MonthStats } from '@/lib/personnel-api';

/** RPC yanıtı 011 (gross_pay…) veya 018 (gross…) anahtarlarını destekler */
export function normalizeMonthStats(raw: Record<string, unknown>, month: string): MonthStats {
  const num = (primary: unknown, fallback?: unknown) => {
    const v = primary ?? fallback;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const gross = num(raw.gross_pay, raw.gross);
  const mesaiPay = num(raw.mesai_pay);
  const totalAdvances = num(raw.total_advances, raw.total_advance);
  const totalDeductions = num(raw.total_deductions, raw.total_deduction);
  const totalMinimum = num(raw.total_minimum);
  const net =
    raw.net_pay != null || raw.net != null
      ? num(raw.net_pay, raw.net)
      : gross - totalAdvances - totalDeductions;

  return {
    month: typeof raw.month === 'string' ? raw.month : month,
    work_days: num(raw.work_days),
    approved_days: num(raw.approved_days),
    pending_days: num(raw.pending_days),
    mesai_units: num(raw.mesai_units),
    mesai_pay: mesaiPay,
    base_pay: num(raw.base_pay, gross - mesaiPay),
    gross_pay: gross,
    total_advances: totalAdvances,
    total_deductions: totalDeductions,
    total_minimum: totalMinimum,
    net_pay: net,
  };
}
