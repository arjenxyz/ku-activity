export type PaymentStatus =
  | 'pending'
  | 'claimed'
  | 'paid'
  | 'partial'
  | 'waived'
  | 'rejected';

export type PaymentMethod = 'transfer' | 'cash' | '';

export type ClaimStatus = 'awaiting_review' | 'approved' | 'rejected';

export type CustodyChannel = 'cash' | 'bank_transfer';

export type PaymentOcrResult = {
  code: string | null;
  amount: number | null;
  iban: string | null;
  dateText: string | null;
  rawText: string;
};

export type PaymentClaim = {
  id: string;
  eventId: string;
  registrationNo: string;
  participantName: string;
  expectedAmount: number;
  expectedCode: string;
  receiptDataUrl: string;
  receiptFileName: string;
  ocr: PaymentOcrResult;
  codeMatched: boolean;
  amountMatched: boolean;
  status: ClaimStatus;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedById: string | null;
  reviewedByName: string | null;
  reviewNote: string;
  disclaimerAck: boolean;
};

export type CustodyTransfer = {
  id: string;
  eventId: string;
  amount: number;
  channel: CustodyChannel;
  fromStaffId: string;
  fromStaffName: string;
  toStaffId: string | null;
  toStaffName: string | null;
  token: string;
  status: 'pending' | 'completed' | 'cancelled';
  note: string;
  createdAt: string;
  completedAt: string | null;
};

export type CashHandoff = {
  token: string;
  eventId: string;
  registrationNo: string;
  amount: number;
  createdAt: string;
  expiresAt: string;
  consumedAt: string | null;
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Bekliyor',
  claimed: 'İncelemede',
  paid: 'Ödendi',
  partial: 'Kısmi',
  waived: 'Muaf',
  rejected: 'Reddedildi',
};

export const ADMIN_DISCLAIMER =
  'Bu kişi ödemeyi yaptığını iddia ediyor. Lütfen banka hesap hareketlerinizi kontrol edip onaylayın. Onayladığınız anda tüm doğrulama sorumluluğu size aittir.';
