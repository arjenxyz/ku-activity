import strings from '@json/src/lib/work-log.json';
import { formatString } from '@/lib/strings/format';

export type MesaiType = 'none' | 'ceyrek' | 'yarim' | 'tam';

export type WorkLogApprovalStatus =
  | 'confirmed'
  | 'pending_employee'
  | 'pending_admin'
  | 'disputed'
  | 'none';

export const MESAI_OPTIONS: Array<{ value: MesaiType; label: string; hint: string }> = [
  { value: 'none', label: strings.mesaiNoneLabel, hint: strings.mesaiNoneHint },
  { value: 'ceyrek', label: strings.mesaiQuarterLabel, hint: strings.mesaiQuarterHint },
  { value: 'yarim', label: strings.mesaiHalfLabel, hint: strings.mesaiHalfHint },
  { value: 'tam', label: strings.mesaiFullLabel, hint: strings.mesaiFullHint },
];

export const DAY_AMOUNT_OPTIONS = [
  { value: 1, label: strings.fullDay },
  { value: 0.5, label: strings.halfDay },
];

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

export function approvalStatusLabel(status: WorkLogApprovalStatus): string {
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

export function mesaiLabel(type: MesaiType | string | null | undefined): string {
  const found = MESAI_OPTIONS.find((o) => o.value === type);
  return found?.label ?? strings.mesaiNoneLabel;
}

export function formatWorkLogSummary(amount: number, mesaiType: MesaiType | string | null): string {
  const day =
    amount === 0.5 ? strings.halfDay : amount === 1 ? strings.fullDay : formatString(strings.dayAmount, { amount });
  if (!mesaiType || mesaiType === 'none') return day;
  return formatString(strings.summaryWithMesai, { day, mesai: mesaiLabel(mesaiType) });
}
