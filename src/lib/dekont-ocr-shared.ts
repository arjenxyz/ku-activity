import type { TransferType } from '@/lib/turkish-banks';

export type DekontOcrResult = {
  rawText: string;
  recipientIban: string | null;
  senderIban: string | null;
  allIbans: string[];
  amount: number | null;
  referenceNo: string | null;
  paymentDate: string | null;
  senderBank: string | null;
  recipientBank: string | null;
  transferType: TransferType | null;
  confidence: 'high' | 'medium' | 'low';
  source: 'pdf' | 'vision' | 'tesseract' | 'none';
  bankKeywords?: string[];
  isLikelyTransfer?: boolean;
  ocrError?: string | null;
  /** Paylaşım akışında OCR henüz tamamlanmadıysa true */
  processing?: boolean;
};

const BANK_KEYWORDS = [
  'DEKONT', 'HAVALE', 'EFT', 'FAST', 'TRANSFER', 'İBAN', 'IBAN', 'TUTAR',
  'GÖNDEREN', 'GONDEREN', 'ALICI', 'ALACAKLI', 'LEHTAR', 'İŞLEM', 'ISLEM',
  'REFERANS', 'BANKA', 'GARANTİ', 'GARANTI', 'ZİRAAT', 'ZIRAAT', 'AKBANK',
  'HALKBANK', 'HALK', 'HALK BANKASI', 'TÜRKİYE HALK', 'TURKIYE HALK',
  'VAKIF', 'QNB', 'ENPARA', 'TRY', 'TL',
];

export function findBankKeywords(text: string): string[] {
  const upper = text
    .toLocaleUpperCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return BANK_KEYWORDS.filter((kw) =>
    upper.includes(kw.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
  );
}

export function isDraftPendingOcr(ocr: unknown): boolean {
  if (!ocr || typeof ocr !== 'object') return false;
  return (ocr as { processing?: boolean }).processing === true;
}
