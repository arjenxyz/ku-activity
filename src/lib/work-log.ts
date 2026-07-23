import { formatString } from '@/lib/strings/format';
import { getRegistryStrings } from '@/lib/i18n/strings-registry';
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/locale';

export type MesaiType = 'none' | 'ceyrek' | 'yarim' | 'tam';

export type WorkLogApprovalStatus =
  | 'confirmed'
  | 'pending_employee'
  | 'pending_admin'
  | 'disputed'
  | 'none';

function workLogStrings(locale: Locale = DEFAULT_LOCALE) {
  return getRegistryStrings('lib/work-log', locale);
}

export function getMesaiOptions(locale: Locale = DEFAULT_LOCALE) {
  const strings = workLogStrings(locale);
  return [
    { value: 'none' as const, label: strings.mesaiNoneLabel, hint: strings.mesaiNoneHint },
    { value: 'ceyrek' as const, label: strings.mesaiQuarterLabel, hint: strings.mesaiQuarterHint },
    { value: 'yarim' as const, label: strings.mesaiHalfLabel, hint: strings.mesaiHalfHint },
    { value: 'tam' as const, label: strings.mesaiFullLabel, hint: strings.mesaiFullHint },
  ];
}

export function getDayAmountOptions(locale: Locale = DEFAULT_LOCALE) {
  const strings = workLogStrings(locale);
  return [
    { value: 1, label: strings.fullDay },
    { value: 0.5, label: strings.halfDay },
  ];
}

/** Varsayılan dil (TR) — tercihen getMesaiOptions(locale) kullanın. */
export const MESAI_OPTIONS = getMesaiOptions();

/** Varsayılan dil (TR) — tercihen getDayAmountOptions(locale) kullanın. */
export const DAY_AMOUNT_OPTIONS = getDayAmountOptions();

export function mesaiTypeToUnits(type: MesaiType): number {
  switch (type) {
    case 'ceyrek':
      return 0.25;
    case 'yarim':
      return 0.5;
    case 'tam':
      return 1;
    default:
      return 0;
  }
}

export function totalPayUnits(amount: number, mesaiUnits: number): number {
  return Number(amount) + Number(mesaiUnits);
}

export function getWorkLogApprovalStatus(log: {
  admin_confirmed_at?: string | null;
  employee_confirmed_at?: string | null;
  employee_disputed_at?: string | null;
  approved?: boolean | null;
}): WorkLogApprovalStatus {
  if (log.approved || log.admin_confirmed_at) return 'confirmed';
  if (log.employee_disputed_at) return 'disputed';
  return 'none';
}

export function approvalStatusLabel(
  status: WorkLogApprovalStatus,
  locale: Locale = DEFAULT_LOCALE
): string {
  const strings = workLogStrings(locale);
  switch (status) {
    case 'confirmed':
      return strings.statusConfirmed;
    case 'pending_employee':
      return strings.statusPendingEmployee;
    case 'pending_admin':
      return strings.statusPendingAdmin;
    case 'disputed':
      return strings.statusDisputed;
    default:
      return strings.statusNone;
  }
}

export function mesaiLabel(
  type: MesaiType | string | null | undefined,
  locale: Locale = DEFAULT_LOCALE
): string {
  const strings = workLogStrings(locale);
  const found = getMesaiOptions(locale).find((o) => o.value === type);
  return found?.label ?? strings.mesaiNoneLabel;
}

export function formatWorkLogSummary(
  amount: number,
  mesaiType: MesaiType | string | null,
  locale: Locale = DEFAULT_LOCALE
): string {
  const strings = workLogStrings(locale);
  const day =
    amount === 0.5
      ? strings.halfDay
      : amount === 1
        ? strings.fullDay
        : formatString(strings.dayAmount, { amount });
  if (!mesaiType || mesaiType === 'none') return day;
  return formatString(strings.summaryWithMesai, { day, mesai: mesaiLabel(mesaiType, locale) });
}
