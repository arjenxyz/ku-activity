import dayjs from 'dayjs';

export type PayrollDeductionDateInput = {
  /** Dekont / formdaki gerçek ödeme tarihi (YYYY-MM-DD) */
  paymentDate: string;
  /** Avans onay zamanı (ISO) */
  approvedAt?: string | null;
  /** Kayıt anı — varsayılan bugün */
  recordedAt?: string | Date;
};

export type PayrollDeductionDateResult = {
  /** deductions.date — bordro ayı */
  deductionDate: string;
  /** YYYY-MM */
  payrollMonth: string;
  /** Gerçek ödeme tarihi (YYYY-MM-DD) */
  proofPaymentDate: string;
  /** Bordro tarihi ödeme gününden farklı mı */
  differsFromPaymentDate: boolean;
};

/**
 * Avansın netten düşüleceği bordro tarihini belirler.
 *
 * - Ödeme onayla aynı ayda ve onaydan önce değilse → ödeme tarihi
 * - Ödeme farklı ayda veya onaydan önceyse → onay / kayıt ayı
 */
export function resolvePayrollDeductionDate(
  input: PayrollDeductionDateInput
): PayrollDeductionDateResult {
  const payment = dayjs(input.paymentDate).startOf('day');
  const proofPaymentDate = payment.isValid()
    ? payment.format('YYYY-MM-DD')
    : dayjs().format('YYYY-MM-DD');

  const paymentDay = dayjs(proofPaymentDate).startOf('day');
  const recorded = dayjs(input.recordedAt ?? undefined).startOf('day');
  const approved = input.approvedAt ? dayjs(input.approvedAt).startOf('day') : null;

  const paymentMonth = paymentDay.format('YYYY-MM');
  const approvedMonth = approved?.format('YYYY-MM') ?? null;
  const recordedMonth = recorded.format('YYYY-MM');
  const operationalMonth = approvedMonth ?? recordedMonth;

  const paidBeforeApproval =
    approved != null && paymentDay.isBefore(approved, 'day');
  const sameMonthAsOperational = paymentMonth === operationalMonth;

  if (sameMonthAsOperational && !paidBeforeApproval) {
    return {
      deductionDate: proofPaymentDate,
      payrollMonth: paymentMonth,
      proofPaymentDate,
      differsFromPaymentDate: false,
    };
  }

  const anchor =
    approved != null && approvedMonth === operationalMonth ? approved : recorded;

  return {
    deductionDate: anchor.format('YYYY-MM-DD'),
    payrollMonth: operationalMonth,
    proofPaymentDate,
    differsFromPaymentDate: anchor.format('YYYY-MM-DD') !== proofPaymentDate,
  };
}

export function formatPayrollMonthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  if (!y || !m) return month;
  return new Date(y, m - 1, 15).toLocaleDateString('tr-TR', {
    month: 'long',
    year: 'numeric',
  });
}
