export type MesaiType = 'none' | 'ceyrek' | 'yarim' | 'tam';

export type WorkLogApprovalStatus =
  | 'confirmed'
  | 'pending_employee'
  | 'pending_admin'
  | 'disputed'
  | 'none';

export const MESAI_OPTIONS: Array<{ value: MesaiType; label: string; hint: string }> = [
  { value: 'none', label: 'Mesai yok', hint: 'Ek mesai ücreti yok' },
  { value: 'ceyrek', label: 'Çeyrek mesai', hint: 'Günlük yevmiyenin %25’i ek' },
  { value: 'yarim', label: 'Yarım mesai', hint: 'Günlük yevmiyenin yarısı ek' },
  { value: 'tam', label: 'Tam mesai', hint: 'Tam günlük yevmiye ek' },
];

export const DAY_AMOUNT_OPTIONS = [
  { value: 1, label: 'Tam gün' },
  { value: 0.5, label: 'Yarım gün' },
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
  if (log.approved) return 'confirmed';
  if (log.employee_disputed_at && !log.employee_confirmed_at) return 'disputed';
  if (log.admin_confirmed_at && !log.employee_confirmed_at) return 'pending_employee';
  if (log.employee_confirmed_at && !log.admin_confirmed_at) return 'pending_admin';
  if (log.admin_confirmed_at || log.employee_confirmed_at) {
    return log.admin_confirmed_at ? 'pending_employee' : 'pending_admin';
  }
  return 'none';
}

export function approvalStatusLabel(status: WorkLogApprovalStatus): string {
  switch (status) {
    case 'confirmed':
      return 'Onaylı';
    case 'pending_employee':
      return 'Personel onayı bekliyor';
    case 'pending_admin':
      return 'Yönetici onayı bekliyor';
    case 'disputed':
      return 'İtiraz edildi';
    default:
      return 'Kayıt yok';
  }
}

export function mesaiLabel(type: MesaiType | string | null | undefined): string {
  const found = MESAI_OPTIONS.find((o) => o.value === type);
  return found?.label ?? 'Mesai yok';
}

export function formatWorkLogSummary(amount: number, mesaiType: MesaiType | string | null): string {
  const day = amount === 0.5 ? 'Yarım gün' : amount === 1 ? 'Tam gün' : `${amount} gün`;
  if (!mesaiType || mesaiType === 'none') return day;
  return `${day} + ${mesaiLabel(mesaiType)}`;
}
