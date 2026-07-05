import type { DekontOcrResult } from '@/lib/dekont-ocr-shared';
import {
  bankNameFromIban,
  detectBankFromText,
  detectTransferType,
  maskIbanForDisplay,
  transferTypeLabel,
  type TransferType,
} from '@/lib/turkish-banks';
import { formatMoney, formatDate } from '@/lib/format';

export type AdvancePaymentDetails = {
  paidAt: string | null;
  paymentDate: string | null;
  amount: number | null;
  referenceNo: string | null;
  transferType: TransferType | null;
  transferTypeLabel: string;
  senderBank: string | null;
  recipientBank: string | null;
  recipientIbanMasked: string | null;
  senderIbanMasked: string | null;
};

export function buildPaymentDetailsFromOcr(
  ocr: Partial<DekontOcrResult> | null | undefined,
  row: {
    paid_at?: string | null;
    approved_amount?: number | null;
    requested_amount?: number;
    proof_reference_no?: string | null;
  }
): AdvancePaymentDetails | null {
  if (!ocr && !row.paid_at) return null;

  const recipientIban = ocr?.recipientIban ?? null;
  const senderIban = ocr?.senderIban ?? null;
  const rawText = ocr?.rawText ?? '';

  const senderBank =
    ocr?.senderBank ??
    bankNameFromIban(senderIban) ??
    detectBankFromText(rawText, 'sender');
  const recipientBank =
    ocr?.recipientBank ??
    bankNameFromIban(recipientIban) ??
    detectBankFromText(rawText, 'recipient');

  const transferType = ocr?.transferType ?? detectTransferType(rawText);

  return {
    paidAt: row.paid_at ?? null,
    paymentDate: ocr?.paymentDate ?? (row.paid_at ? row.paid_at.slice(0, 10) : null),
    amount: ocr?.amount ?? row.approved_amount ?? row.requested_amount ?? null,
    referenceNo: row.proof_reference_no ?? ocr?.referenceNo ?? null,
    transferType,
    transferTypeLabel: transferTypeLabel(transferType),
    senderBank,
    recipientBank,
    recipientIbanMasked: maskIbanForDisplay(recipientIban),
    senderIbanMasked: maskIbanForDisplay(senderIban),
  };
}

export function sanitizeOcrForPersonnel(
  ocr: Record<string, unknown> | null | undefined
): Partial<DekontOcrResult> | null {
  if (!ocr || typeof ocr !== 'object') return null;
  const {
    recipientIban,
    senderIban,
    amount,
    referenceNo,
    paymentDate,
    senderBank,
    recipientBank,
    transferType,
    confidence,
  } = ocr as Partial<DekontOcrResult>;
  return {
    recipientIban: recipientIban ?? null,
    senderIban: senderIban ?? null,
    amount: amount ?? null,
    referenceNo: referenceNo ?? null,
    paymentDate: paymentDate ?? null,
    senderBank: senderBank ?? null,
    recipientBank: recipientBank ?? null,
    transferType: transferType ?? null,
    confidence: confidence ?? 'low',
    rawText: '',
    allIbans: [],
    source: 'none',
  };
}

export function formatPaymentDetailLines(details: AdvancePaymentDetails): Array<{ label: string; value: string }> {
  const lines: Array<{ label: string; value: string }> = [];

  if (details.senderBank) {
    lines.push({ label: 'Gönderen banka', value: details.senderBank });
  }
  if (details.recipientBank) {
    lines.push({ label: 'Alıcı banka (hesabınız)', value: details.recipientBank });
  }
  if (details.amount != null) {
    lines.push({ label: 'Yatırılan tutar', value: formatMoney(details.amount) });
  }
  if (details.paymentDate) {
    lines.push({ label: 'İşlem tarihi', value: formatDate(details.paymentDate) });
  }
  if (details.paidAt) {
    lines.push({ label: 'Kayıt tarihi', value: formatDate(details.paidAt.slice(0, 10)) });
  }
  if (details.transferTypeLabel) {
    lines.push({ label: 'Transfer tipi', value: details.transferTypeLabel });
  }
  if (details.referenceNo) {
    lines.push({ label: 'Referans / dekont no', value: details.referenceNo });
  }
  if (details.recipientIbanMasked) {
    lines.push({ label: 'Alıcı IBAN', value: details.recipientIbanMasked });
  }

  return lines;
}
