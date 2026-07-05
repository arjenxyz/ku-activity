import { parseIbanFromText, validateTurkishIban, normalizeIban } from '@/lib/field-encryption';
import { findBankKeywords, type DekontOcrResult } from '@/lib/dekont-ocr-shared';
import {
  bankNameFromIban,
  detectBankFromText,
  detectTransferType,
} from '@/lib/turkish-banks';

function parseTurkishAmount(text: string): number | null {
  const patterns = [
    /(?:TUTAR|Amount|Miktar|Transfer)[:\s]*(?:TRY|TL)?\s*([\d.]+,\d{2})/gi,
    /([\d]{1,3}(?:\.\d{3})+,\d{2})\s*(?:TRY|TL)/gi,
    /([\d]+,\d{2})\s*(?:TRY|TL)/gi,
  ];

  const candidates: number[] = [];
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const raw = match[1]?.replace(/\./g, '').replace(',', '.');
      const num = Number(raw);
      if (Number.isFinite(num) && num > 0 && num < 10_000_000) {
        candidates.push(num);
      }
    }
  }

  if (candidates.length === 0) return null;
  return Math.max(...candidates);
}

function parseReferenceNo(text: string): string | null {
  const patterns = [
    /(?:REF(?:ERANS)?|İşlem|Islem|Dekont|Fis|Fiş|Referans\s*No)[:\s#-]*([A-Z0-9-]{6,24})/gi,
    /\b([A-Z]{2,4}\d{8,16})\b/g,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

function parsePaymentDate(text: string): string | null {
  const match = text.match(/(\d{2})[./](\d{2})[./](\d{4})/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
}

function extractIbans(text: string): string[] {
  const found = new Set<string>();
  const compact = text.replace(/\s/g, '').toUpperCase();
  const regex = /TR\d{24}/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(compact)) !== null) {
    const iban = match[0];
    if (validateTurkishIban(iban)) found.add(normalizeIban(iban));
  }

  const parsed = parseIbanFromText(text);
  if (parsed && validateTurkishIban(parsed)) found.add(normalizeIban(parsed));
  return [...found];
}

function pickIbanNearMarkers(text: string, ibans: string[], markers: string[]): string | null {
  const upper = text.toLocaleUpperCase('tr-TR');
  for (const marker of markers) {
    const idx = upper.indexOf(marker);
    if (idx === -1) continue;
    const slice = upper.slice(idx, idx + 140);
    const match = slice.match(/TR\d{2}(?:\s?\d{4}){5}\s?\d{2}/);
    if (match) {
      const compact = match[0].replace(/\s/g, '');
      if (validateTurkishIban(compact)) return normalizeIban(compact);
    }
  }
  return null;
}

function pickRecipientIban(text: string, ibans: string[]): string | null {
  if (ibans.length === 0) return null;

  const near = pickIbanNearMarkers(text, ibans, [
    'ALICI IBAN',
    'ALICI İBAN',
    'ALICI:',
    'ALACAKLI',
    'LEHTAR',
    'KARŞI HESAP',
    'KARSI HESAP',
    'ALICI HESAP',
  ]);
  if (near) return near;

  if (ibans.length === 1) return ibans[0]!;
  return ibans[ibans.length - 1] ?? ibans[0]!;
}

function pickSenderIban(text: string, ibans: string[], recipientIban: string | null): string | null {
  const near = pickIbanNearMarkers(text, ibans, [
    'GÖNDEREN IBAN',
    'GONDEREN IBAN',
    'GÖNDEREN:',
    'GONDEREN:',
    'GÖNDEREN HESAP',
    'GONDEREN HESAP',
    'GÖNDERİCİ',
    'GONDERICI',
  ]);
  if (near && near !== recipientIban) return near;

  const others = ibans.filter((i) => i !== recipientIban);
  if (others.length === 1) return others[0]!;
  if (others.length > 1) return others[0]!;
  return null;
}

function scoreConfidence(result: Omit<DekontOcrResult, 'confidence'>): 'high' | 'medium' | 'low' {
  let score = 0;
  if (result.recipientIban) score += 2;
  if (result.amount != null) score += 2;
  if (result.referenceNo) score += 1;
  if (result.rawText.length > 80) score += 1;
  if (score >= 4) return 'high';
  if (score >= 2) return 'medium';
  return 'low';
}

export function buildOcrResultFromRawText(
  rawText: string,
  source: DekontOcrResult['source'] = 'tesseract',
  ocrError: string | null = null
): DekontOcrResult {
  const allIbans = extractIbans(rawText);
  const recipientIban = pickRecipientIban(rawText, allIbans);
  const senderIban = pickSenderIban(rawText, allIbans, recipientIban);
  const amount = parseTurkishAmount(rawText);
  const referenceNo = parseReferenceNo(rawText);
  const paymentDate = parsePaymentDate(rawText);
  const bankKeywords = findBankKeywords(rawText);
  const transferType = detectTransferType(rawText);
  const senderBank =
    bankNameFromIban(senderIban) ?? detectBankFromText(rawText, 'sender') ?? detectBankFromText(rawText, 'any');
  const recipientBank = bankNameFromIban(recipientIban) ?? detectBankFromText(rawText, 'recipient');
  const transferFields = [recipientIban, amount, paymentDate, referenceNo].filter(Boolean).length;

  const base = {
    rawText: rawText.slice(0, 12000),
    recipientIban,
    senderIban,
    allIbans,
    amount,
    referenceNo,
    paymentDate,
    senderBank,
    recipientBank,
    transferType,
    source,
    bankKeywords,
    isLikelyTransfer: bankKeywords.length >= 2 && transferFields >= 2,
    ocrError,
  };

  return { ...base, confidence: scoreConfidence(base) };
}

export function sniffDekontContentKind(
  bytes: Uint8Array | Buffer,
  mimeType: string
): 'pdf' | 'image' | 'unknown' {
  if (bytes.length >= 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return 'pdf';
  }
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xd8) return 'image';
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return 'image';
  }
  const mime = mimeType.toLowerCase();
  if (mime === 'application/pdf') return 'pdf';
  if (mime.startsWith('image/')) return 'image';
  return 'unknown';
}
