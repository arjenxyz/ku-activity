import { parseAdvanceTransferTokenFromText } from '@/lib/advance-transfer-token';
import { parseIbanFromText, validateTurkishIban, normalizeIban } from '@/lib/field-encryption';
import { normalizeOcrText } from '@/lib/dekont-ocr-normalize';
import { findBankKeywords, type DekontOcrResult } from '@/lib/dekont-ocr-shared';
import {
  bankNameFromIban,
  detectBankFromText,
  detectTransferType,
} from '@/lib/turkish-banks';

/** Türkçe: 1.234,56 veya 1234,56 */
const AMOUNT_TOKEN = String.raw`(\d{1,3}(?:[.\s]\d{3})*|\d+),\d{2}`;
/** Kuruşsuz: 5.000 veya 5000 */
const AMOUNT_WHOLE_TOKEN = String.raw`(\d{1,3}(?:[.\s]\d{3})+|\d{2,7})\b`;

type AmountCandidate = { value: number; priority: number };

function parseAmountToken(raw: string): number | null {
  const normalized = raw.trim().replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  const num = Number(normalized);
  if (!Number.isFinite(num) || num <= 0 || num >= 10_000_000) return null;
  return num;
}

function parseWholeAmountToken(raw: string): number | null {
  const normalized = raw.trim().replace(/\s/g, '').replace(/\./g, '');
  const num = Number(normalized);
  if (!Number.isFinite(num) || num < 100 || num >= 10_000_000) return null;
  return num;
}

function collectAmountMatches(
  text: string,
  pattern: RegExp,
  priority: number,
  candidates: AmountCandidate[],
  parser: (raw: string) => number | null = parseAmountToken
) {
  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
  const re = new RegExp(pattern.source, flags);
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const raw = match[1];
    if (!raw) continue;
    const num = parser(raw);
    if (num != null) candidates.push({ value: num, priority });
  }
}

function pickBestAmongValues(values: number[]): number | null {
  if (values.length === 0) return null;
  if (values.length === 1) return values[0]!;

  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0]!;
  const max = sorted[sorted.length - 1]!;

  // Havale tutarı genelde büyük; masraf veya OCR gürültüsü (6,00 / 12,00 vb.) küçük kalır
  if (max >= 100 && min < 100) return max;
  if (max >= 500 && min < 500 && max / Math.max(min, 1) >= 3) return max;
  if (values.length === 2 && max / Math.max(min, 1) >= 5) return max;
  if (values.length >= 2 && max / Math.max(min, 1) >= 3) return max;

  return max;
}

function pickBestAmount(candidates: AmountCandidate[]): number | null {
  if (candidates.length === 0) return null;

  const bestPriority = Math.min(...candidates.map((c) => c.priority));
  const tier = candidates.filter((c) => c.priority === bestPriority);
  const tierValues = [...new Set(tier.map((c) => c.value))];
  const tierPicked = pickBestAmongValues(tierValues);

  const allValues = [...new Set(candidates.map((c) => c.value))];
  const globalMax = Math.max(...allValues);

  // Etiketli ama parçalanmış OCR (12,00) metindeki net binlik tutarı (12.375,00) ezmesin
  if (
    tierPicked != null &&
    globalMax > tierPicked &&
    globalMax >= 100 &&
    tierPicked < 500 &&
    globalMax / Math.max(tierPicked, 1) >= 5
  ) {
    return globalMax;
  }

  return tierPicked;
}

/** Metindeki açık Türkçe tutar biçimlerini tara — etiket eşleşmesinden bağımsız */
function scanFormattedTurkishAmounts(text: string): number[] {
  const found: number[] = [];
  const patterns = [
    /\d{1,3}(?:\.\d{3})+,\d{2}/g,
    /\d{4,7},\d{2}/g,
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const num = parseAmountToken(match[0]);
      if (num != null) found.push(num);
    }
  }

  return found;
}

function resolveFinalAmount(candidates: AmountCandidate[], normalizedText: string): number | null {
  const regexPicked = pickBestAmount(candidates);
  const formatted = scanFormattedTurkishAmounts(normalizedText);
  if (formatted.length === 0) return regexPicked;

  const formattedMax = Math.max(...formatted);
  if (regexPicked == null) return formattedMax;

  // Metinde 12.375,00 net görünüyorsa 12 TL parçasını reddet
  if (formattedMax > regexPicked && formattedMax >= 100 && regexPicked < 500) {
    if (formattedMax / Math.max(regexPicked, 1) >= 3) return formattedMax;
  }

  return regexPicked;
}

const AMOUNT_LABEL =
  String.raw`(?:İşlem|Islem|Işlem|ISLEM|Transfer|Gönderilen|Gonderilen|Gönderim|Gonderim|Havale|EFT|FAST|Ödenen|Odenen|Ödeme|Odeme|Net|Brüt|Brut|Para|Miktar|Amount|TUTAR|Tutar[ıiİI]?)`;

/** Türkçe binlik noktalı: 12.375,00 — veya noktasız 12375,00 */
const AMOUNT_TR_THOUSANDS = String.raw`(\d{1,3}(?:\.\d{3})+,\d{2})`;
const AMOUNT_TR_COMPACT = String.raw`(\d{4,7},\d{2})`;

function parseTurkishAmount(text: string): number | null {
  const normalized = normalizeOcrText(text);

  const candidates: AmountCandidate[] = [];

  const labeledHigh = [
    // Halkbank / Ziraat: İŞLEM TUTARI (TL) 12.375,00
    new RegExp(
      String.raw`(?:İŞLEM|ISLEM|İşlem|Islem)\s*TUTARI?\s*\(?\s*TL\s*\)?\s*[:\s]*${AMOUNT_TR_THOUSANDS}`,
      'gi'
    ),
    new RegExp(
      String.raw`(?:TOPLAM|Toplam)\s*\(?\s*TL\s*\)?\s*[:\s]*${AMOUNT_TR_THOUSANDS}`,
      'gi'
    ),
    new RegExp(
      String.raw`(?:İŞLEM|ISLEM|İşlem|Islem)\s*TUTARI?\s*\(?\s*TL\s*\)?\s*[:\s]*${AMOUNT_TR_COMPACT}`,
      'gi'
    ),
    new RegExp(
      String.raw`(?:TOPLAM|Toplam)\s*\(?\s*TL\s*\)?\s*[:\s]*${AMOUNT_TR_COMPACT}`,
      'gi'
    ),
    new RegExp(String.raw`${AMOUNT_LABEL}\s*Tutar[ıiİI]?\s*[:\-]?\s*(?:TRY|TL)?\s*${AMOUNT_TOKEN}`, 'gi'),
    new RegExp(
      String.raw`(?:İşlem|Islem|Transfer)\s*Tutar[ıiİI]?\s*[:\-]?\s*\n\s*(?:TRY|TL)?\s*${AMOUNT_TOKEN}`,
      'gi'
    ),
    new RegExp(String.raw`${AMOUNT_LABEL}\s*[:\-]\s*(?:TRY|TL)?\s*${AMOUNT_TOKEN}`, 'gi'),
    new RegExp(String.raw`${AMOUNT_LABEL}\s*[:\-]?\s*\n\s*(?:TRY|TL)?\s*${AMOUNT_TOKEN}`, 'gi'),
  ];

  const labeledMid = [
    new RegExp(String.raw`(?:TUTAR|Tutar[ıiİI]?|Miktar|Amount)\s*[:\-]\s*(?:TRY|TL)?\s*${AMOUNT_TOKEN}`, 'gi'),
    new RegExp(String.raw`(?:TUTAR|Amount|Miktar|Transfer)\s*[:\-]?\s*(?:TRY|TL)?\s*${AMOUNT_TOKEN}`, 'gi'),
    new RegExp(String.raw`${AMOUNT_LABEL}\s*[:\-]?\s*(?:TRY|TL)?\s*${AMOUNT_WHOLE_TOKEN}(?!\s*,)`, 'gi'),
  ];

  const withCurrency = [
    new RegExp(String.raw`${AMOUNT_TOKEN}\s*(?:TRY|TL)\b`, 'gi'),
    new RegExp(String.raw`(?:TRY|TL)\s*${AMOUNT_TOKEN}`, 'gi'),
  ];

  const parseLabeledToken = (raw: string) => {
    const num = parseAmountToken(raw);
    // İşlem tutarı etiketi altında 12,00 gibi OCR parçası; gerçek havale genelde ≥100 TL
    if (num != null && num < 100) return null;
    return num;
  };

  for (const pattern of labeledHigh) {
    if (pattern.source.includes(AMOUNT_TR_THOUSANDS) || pattern.source.includes(AMOUNT_TR_COMPACT)) {
      collectAmountMatches(normalized, pattern, 1, candidates, (raw) => parseAmountToken(raw));
    } else {
      collectAmountMatches(normalized, pattern, 1, candidates, parseLabeledToken);
    }
  }
  for (const pattern of labeledMid) {
    if (pattern.source.includes(AMOUNT_WHOLE_TOKEN)) {
      collectAmountMatches(normalized, pattern, 2, candidates, parseWholeAmountToken);
    } else {
      collectAmountMatches(normalized, pattern, 2, candidates);
    }
  }
  for (const pattern of withCurrency) collectAmountMatches(normalized, pattern, 3, candidates);

  const picked = resolveFinalAmount(candidates, normalized);
  if (picked != null) return picked;

  // Son çare: metindeki biçimlendirilmiş tutarlar (TL etiketi olmasa bile)
  const bare = new RegExp(AMOUNT_TOKEN, 'g');
  const bareCandidates: AmountCandidate[] = [];
  collectAmountMatches(normalized, bare, 4, bareCandidates);
  const filteredBare = bareCandidates.filter(
    (c) => c.value >= 100 || bareCandidates.every((o) => o.value < 100)
  );
  const barePicked = resolveFinalAmount(
    filteredBare.length ? filteredBare : bareCandidates,
    normalized
  );
  if (barePicked != null) return barePicked;

  // ABD formatı — metinde Türkçe tutar (12.375,00) yoksa dene; aksi halde 12.375,00 → 12.00 hatası
  const hasTurkishAmount = /\d{1,3}(?:\.\d{3})+,\d{2}/.test(normalized);
  if (hasTurkishAmount) return null;

  const usFormat = /(\d{1,3}(?:,\d{3})+|\d+)\.(\d{2})\b/g;
  let usMatch: RegExpExecArray | null;
  const usCandidates: AmountCandidate[] = [];
  while ((usMatch = usFormat.exec(normalized)) !== null) {
    const raw = `${usMatch[1]}.${usMatch[2]}`;
    const num = parseAmountToken(raw.replace(/,/g, ''));
    if (num != null) usCandidates.push({ value: num, priority: 5 });
  }
  return pickBestAmount(usCandidates);
}

function parseReferenceNo(text: string): string | null {
  const patterns = [
    /(?:REF(?:ERANS)?|Dekont|Fis|Fiş|Referans\s*No|ARŞİV\s*REFERANS)[:\s#-]*([A-Z0-9][A-Z0-9\s-]{5,28})/gi,
    /(?:İşlem|Islem)\s*(?:No|Numarası|Numarasi)[:\s#-]*([A-Z0-9-]{6,24})/gi,
    /\b([A-Z]{1,2}-\d{4}\s+\d{2}\s+\d{2}-\d{2}\.\d{2}\.\d{2}\.\d+)/g,
    /\b([A-Z]{2,4}\d{8,16})\b/g,
  ];

  const stopWords = new Set(['KANALI', 'MOBIL', 'MOBİL', 'INTERNET', 'İNTERNET', 'SUBE', 'ŞUBE']);

  for (const pattern of patterns) {
    const re = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`);
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      const candidate = match[1]?.trim().replace(/\s+/g, ' ');
      if (!candidate || stopWords.has(candidate.toUpperCase())) continue;
      if (candidate.length >= 6) return candidate;
    }
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
  const transferToken = parseAdvanceTransferTokenFromText(rawText);
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
    transferToken,
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
