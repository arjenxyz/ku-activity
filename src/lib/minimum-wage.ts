/** Resmi brüt aylık asgari ücret (2026). Ortam değişkeni ile güncellenebilir. */
const DEFAULT_GROSS_MINIMUM_2026 = 33_030;
const DEFAULT_NET_MINIMUM_2026 = 28_075.5;

export function getOfficialMonthlyMinimumWageGross(): number {
  const env =
    typeof process !== 'undefined'
      ? process.env.NEXT_PUBLIC_OFFICIAL_MINIMUM_WAGE_GROSS
      : undefined;
  if (env) {
    const n = Number(env);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return DEFAULT_GROSS_MINIMUM_2026;
}

export function getOfficialMonthlyMinimumWageNet(): number {
  const env =
    typeof process !== 'undefined'
      ? process.env.NEXT_PUBLIC_OFFICIAL_MINIMUM_WAGE_NET
      : undefined;
  if (env) {
    const n = Number(env);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return DEFAULT_NET_MINIMUM_2026;
}

export type MinimumWageGapSummary = {
  officialGross: number;
  grossEarned: number;
  minimumPaid: number;
  suggestedTopUp: number;
  isBelowMinimum: boolean;
  remainingGap: number;
};

/** Brüt yevmiye + mesai kazancı resmi asgari brütün altındaysa tamamlama tutarını hesaplar. */
export function computeMinimumWageGap(params: {
  grossEarned: number;
  minimumPaid?: number;
  officialGross?: number;
}): MinimumWageGapSummary {
  const officialGross = params.officialGross ?? getOfficialMonthlyMinimumWageGross();
  const minimumPaid = params.minimumPaid ?? 0;
  const grossEarned = params.grossEarned;
  const totalWithMinimum = grossEarned + minimumPaid;
  const remainingGap = Math.max(0, officialGross - totalWithMinimum);

  return {
    officialGross,
    grossEarned,
    minimumPaid,
    suggestedTopUp: remainingGap,
    isBelowMinimum: totalWithMinimum < officialGross,
    remainingGap,
  };
}

export function computeNetPay(
  gross: number,
  advances: number,
  deductions: number,
  minimum: number
): number {
  return gross - advances - deductions + minimum;
}
