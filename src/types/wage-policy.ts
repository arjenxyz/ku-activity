import strings from '@json/src/types/wage-policy.json';

/** Yevmiye ne zaman ödenir (birden fazla seçilebilir) */
export type YevmiyePaymentTrigger = 'month_end' | 'roof_complete' | 'job_complete';

/** Asgari oranlama: ay ortası girişte nasıl hesaplansın */
export type AsgariProrationMode = 'calendar_days' | 'worked_days' | 'full_month';

/** Dekonttan okunan kesintiler (BES vb.) — ileride otomatik içe aktarma için */
export type DekontDeductionMode = 'manual_review' | 'ignore' | 'auto_separate';

export type WagePolicy = {
  /** Yevmiye ödeme zamanları — sahadaki uygulama */
  yevmiyePaymentTriggers: YevmiyePaymentTrigger[];
  yevmiyePaymentNotes: string;

  /** Resmi aylık asgari (₺). Boşsa sistem varsayılanı (2026: 33.030) */
  officialMonthlyMinimum: number | null;

  /** İşe giriş tarihinden itibaren oranlansın mı */
  prorationFromHireDate: boolean;
  prorationMode: AsgariProrationMode;

  /** Dekont otomatik yükleme (henüz aktif değil) */
  dekontImportEnabled: boolean;
  dekontDeductionMode: DekontDeductionMode;
  dekontNotes: string;

  configuredAt: string | null;
};

export const DEFAULT_WAGE_POLICY: WagePolicy = {
  yevmiyePaymentTriggers: ['month_end'],
  yevmiyePaymentNotes: '',
  officialMonthlyMinimum: null,
  prorationFromHireDate: true,
  prorationMode: 'calendar_days',
  dekontImportEnabled: false,
  dekontDeductionMode: 'manual_review',
  dekontNotes: '',
  configuredAt: null,
};

export const YEVMIYE_TRIGGER_LABELS: Record<YevmiyePaymentTrigger, string> =
  strings.yevmiyeTriggerLabels as Record<YevmiyePaymentTrigger, string>;

export const PRORATION_MODE_LABELS: Record<AsgariProrationMode, string> =
  strings.prorationModeLabels as Record<AsgariProrationMode, string>;

export const DEKONT_DEDUCTION_LABELS: Record<DekontDeductionMode, string> =
  strings.dekontDeductionLabels as Record<DekontDeductionMode, string>;

export function normalizeWagePolicy(raw: unknown): WagePolicy {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const triggers = Array.isArray(o.yevmiyePaymentTriggers)
    ? o.yevmiyePaymentTriggers.filter((t): t is YevmiyePaymentTrigger =>
        t === 'month_end' || t === 'roof_complete' || t === 'job_complete'
      )
    : DEFAULT_WAGE_POLICY.yevmiyePaymentTriggers;

  const prorationMode =
    o.prorationMode === 'calendar_days' ||
    o.prorationMode === 'worked_days' ||
    o.prorationMode === 'full_month'
      ? o.prorationMode
      : DEFAULT_WAGE_POLICY.prorationMode;

  const dekontDeductionMode =
    o.dekontDeductionMode === 'manual_review' ||
    o.dekontDeductionMode === 'ignore' ||
    o.dekontDeductionMode === 'auto_separate'
      ? o.dekontDeductionMode
      : DEFAULT_WAGE_POLICY.dekontDeductionMode;

  const minRaw = o.officialMonthlyMinimum;
  const officialMonthlyMinimum =
    minRaw == null || minRaw === ''
      ? null
      : Number.isFinite(Number(minRaw)) && Number(minRaw) > 0
        ? Number(minRaw)
        : null;

  return {
    yevmiyePaymentTriggers: triggers.length ? triggers : ['month_end'],
    yevmiyePaymentNotes: typeof o.yevmiyePaymentNotes === 'string' ? o.yevmiyePaymentNotes : '',
    officialMonthlyMinimum,
    prorationFromHireDate:
      typeof o.prorationFromHireDate === 'boolean'
        ? o.prorationFromHireDate
        : DEFAULT_WAGE_POLICY.prorationFromHireDate,
    prorationMode,
    dekontImportEnabled: o.dekontImportEnabled === true,
    dekontDeductionMode,
    dekontNotes: typeof o.dekontNotes === 'string' ? o.dekontNotes : '',
    configuredAt: typeof o.configuredAt === 'string' ? o.configuredAt : null,
  };
}
