import { getRegistryStrings } from '@/lib/i18n/strings-registry';
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/locale';

export type AdvanceRequestStatus =
  | 'pending'
  | 'approved'
  | 'awaiting_receipt'
  | 'paid'
  | 'rejected'
  | 'cancelled'
  | 'expired';

export type AdvancePaymentMethod = 'bank_transfer' | 'cash';

export function getAdvanceStatusLabels(locale: Locale = DEFAULT_LOCALE) {
  return getRegistryStrings('lib/advance-types', locale).statusLabels as Record<
    AdvanceRequestStatus,
    string
  >;
}

export function getAdvancePaymentMethodLabels(locale: Locale = DEFAULT_LOCALE) {
  return getRegistryStrings('lib/advance-types', locale).paymentMethodLabels as Record<
    AdvancePaymentMethod,
    string
  >;
}

/** Varsayılan dil (TR) — tercihen getAdvanceStatusLabels(locale) kullanın. */
export const ADVANCE_STATUS_LABELS = getAdvanceStatusLabels();

/** Varsayılan dil (TR) — tercihen getAdvancePaymentMethodLabels(locale) kullanın. */
export const ADVANCE_PAYMENT_METHOD_LABELS = getAdvancePaymentMethodLabels();

export type AdvanceRequestRow = {
  id: string;
  project_id: string;
  employee_id: string;
  requested_amount: number;
  approved_amount: number | null;
  employee_note: string | null;
  admin_note: string | null;
  status: AdvanceRequestStatus;
  payment_method: AdvancePaymentMethod | null;
  job_id: string | null;
  requested_at: string;
  approved_at: string | null;
  paid_at: string | null;
  rejected_at: string | null;
  cancelled_at: string | null;
  rejection_reason: string | null;
  proof_storage_backend: string | null;
  proof_external_id: string | null;
  proof_file_name: string | null;
  proof_mime_type: string | null;
  proof_reference_no: string | null;
  deduction_id: string | null;
  employees?: { name: string } | null;
};

export function advanceDisplayAmount(row: Pick<AdvanceRequestRow, 'approved_amount' | 'requested_amount'>) {
  return row.approved_amount ?? row.requested_amount;
}

export function canCancelAdvance(status: AdvanceRequestStatus) {
  return status === 'pending';
}

export function canApproveAdvance(status: AdvanceRequestStatus) {
  return status === 'pending';
}

export function canRecordPayment(status: AdvanceRequestStatus) {
  return status === 'approved' || status === 'awaiting_receipt';
}

export function canRejectAdvance(status: AdvanceRequestStatus) {
  return status === 'pending' || status === 'approved' || status === 'awaiting_receipt';
}

/** Ödeme veya nakit teslimi tamamlanmadan yeni talep açılamaz */
export function hasAdvanceAwaitingPayment(status: AdvanceRequestStatus) {
  return status === 'approved' || status === 'awaiting_receipt';
}
