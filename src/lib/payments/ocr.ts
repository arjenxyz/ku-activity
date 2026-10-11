import type { ExtractMethod, MatchConfidence, PaymentOcrResult } from '@/lib/payments/types';

const CODE_RE = /\b([A-Z]{2,5}-[A-Z0-9]{3,8})\b/g;
const REG_NO_RE = /\b([A-Z]{2,5}-\d{4}-\d{4,8})\b/g;
const AMOUNT_RE =
  /(?:₺|TRY|TL)?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?|\d+)\s*(?:₺|TRY|TL)?/gi;

const BANK_HINT_RE =
  /DEKONT|HAVALE|EFT|FAST|IBAN|ALICI|G[OÖ]NDEREN|TUTAR|TRANSFER|BANKA|[OÖ]DEME|HESAP|[Iİ][SŞ]LEM|REF\.?|RECEIPT|PAYMENT/;

const MIN_PDF_TEXT_CHARS = 40;
/** Cap total extract time so the upload UI does not hang on Tesseract. */
const EXTRACT_BUDGET_MS = 8_000;

export const RECEIPT_NOT_RECOGNIZED_ERROR =
  'Dosya dekont gibi görünmüyor. Banka dekontu (PDF/foto) yükleyin.';

export type ReceiptExtractResult = {
  text: string;
  method: ExtractMethod;
  pageCount: number;
};

function withBudget<T>(promise: Promise<T>, fallback: T, ms = EXTRACT_BUDGET_MS): Promise<T> {
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(fallback);
      }
    }, ms);
    promise
      .then((value) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(value);
        }
      })
      .catch(() => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(fallback);
        }
      });
  });
}

export function normalizeIban(value: string | null | undefined) {
  if (!value) return '';
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function compactAlnum(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function textIncludesLoose(haystack: string, needle: string) {
  if (!needle) return false;
  const upper = haystack.toUpperCase();
  if (upper.includes(needle.toUpperCase())) return true;
  return compactAlnum(haystack).includes(compactAlnum(needle));
}

function findIban(text: string): string | null {
  const compact = compactAlnum(text);
  const match = compact.match(/TR\d{24}/);
  return match ? match[0] : null;
}

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/\s/g, '').replace(/₺|TRY|TL/gi, '');
  if (cleaned.includes(',') && cleaned.includes('.')) {
    const normalized = cleaned.replace(/\./g, '').replace(',', '.');
    const n = Number(normalized);
    return Number.isFinite(n) ? Math.round(n) : null;
  }
  if (cleaned.includes(',')) {
    const parts = cleaned.split(',');
    // "850,00" → 850; "1.250,00" handled above
    if (parts[1] && parts[1].length <= 2) {
      const n = Number(parts[0].replace(/\D/g, ''));
      return Number.isFinite(n) ? n : null;
    }
    const n = Number(parts[0].replace(/\D/g, ''));
    return Number.isFinite(n) ? n : null;
  }
  // Prefer "850.00" as 850 when 2 decimal digits; else strip dots as thousand separators
  if (/^\d+\.\d{2}$/.test(cleaned)) {
    const n = Number(cleaned);
    return Number.isFinite(n) ? Math.round(n) : null;
  }
  const n = Number(cleaned.replace(/\./g, '').replace(/[^\d]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}

async function ocrBuffer(buffer: Buffer | Uint8Array): Promise<string> {
  try {
    const Tesseract = await import('tesseract.js');
    // Single language pack is faster than eng+tur for first load.
    const result = await Tesseract.recognize(Buffer.from(buffer), 'tur', {
      logger: () => undefined,
    });
    return result.data.text ?? '';
  } catch {
    try {
      const Tesseract = await import('tesseract.js');
      const result = await Tesseract.recognize(Buffer.from(buffer), 'eng', {
        logger: () => undefined,
      });
      return result.data.text ?? '';
    } catch {
      return '';
    }
  }
}

async function extractPdf(buffer: Buffer): Promise<ReceiptExtractResult> {
  try {
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: buffer });
    try {
      const textResult = await parser.getText({ first: 1, last: 2 });
      const text = (textResult.text ?? '').trim();
      const pageCount =
        typeof textResult.total === 'number'
          ? textResult.total
          : Array.isArray(textResult.pages)
            ? textResult.pages.length
            : 1;

      if (text.replace(/\s+/g, ' ').length >= MIN_PDF_TEXT_CHARS) {
        return { text, method: 'pdf-text', pageCount };
      }

      // Scanned/image-only PDFs: skip heavy page-render OCR in the request path
      // so upload stays snappy; admin reviews the file visually.
      return { text: '', method: 'empty', pageCount: pageCount || 1 };
    } finally {
      await parser.destroy().catch(() => undefined);
    }
  } catch {
    return { text: '', method: 'empty', pageCount: 0 };
  }
}

async function extractReceiptContentInner(
  buffer: Buffer,
  mimeType: string
): Promise<ReceiptExtractResult> {
  if (mimeType.startsWith('text/') || mimeType === 'application/json') {
    return { text: buffer.toString('utf8'), method: 'pdf-text', pageCount: 1 };
  }

  if (mimeType === 'application/pdf' || mimeType === 'application/x-pdf') {
    return extractPdf(buffer);
  }

  if (mimeType.startsWith('image/')) {
    const text = (await withBudget(ocrBuffer(buffer), '', 6_000)).trim();
    return { text, method: text ? 'ocr' : 'empty', pageCount: 1 };
  }

  return { text: '', method: 'empty', pageCount: 0 };
}

/**
 * Extract text from receipt PDF/image for matching.
 * Never throws — empty/timeout falls through to admin review.
 */
export async function extractReceiptContent(
  buffer: Buffer,
  mimeType: string
): Promise<ReceiptExtractResult> {
  return withBudget(
    extractReceiptContentInner(buffer, mimeType),
    { text: '', method: 'empty', pageCount: 0 },
    EXTRACT_BUDGET_MS
  );
}

/** @deprecated Prefer extractReceiptContent — kept for callers expecting a string. */
export async function extractReceiptText(buffer: Buffer, mimeType: string): Promise<string> {
  const result = await extractReceiptContent(buffer, mimeType);
  return result.text;
}

export type ParseReceiptOptions = {
  expectedPaymentCode?: string | null;
  expectedRegistrationNo?: string | null;
  expectedAmount?: number | null;
  expectedIban?: string | null;
  extractMethod?: ExtractMethod;
};

export type ParsedReceiptMatch = PaymentOcrResult & {
  codeMatched: boolean;
  amountMatched: boolean;
  ibanMatched: boolean;
  confidence: MatchConfidence;
  extractMethod: ExtractMethod;
};

function collectAmounts(text: string): number[] {
  const amounts: number[] = [];
  for (const match of text.matchAll(AMOUNT_RE)) {
    const parsed = parseAmount(match[1] ?? '');
    if (parsed != null && parsed >= 10 && parsed <= 1_000_000) amounts.push(parsed);
  }
  return amounts;
}

/** True when OCR text has common bank-receipt signals (even if fields don't match). */
export function looksLikeBankReceipt(rawText: string): boolean {
  const text = (rawText || '').trim();
  if (!text) return false;
  const upper = text.toUpperCase();
  if (findIban(upper)) return true;
  if (BANK_HINT_RE.test(upper)) return true;
  return false;
}

/** Parse bank-receipt-like text and score matches against expected payment fields. */
export function parseReceiptText(
  rawText: string,
  expectedCodeOrOptions?: string | ParseReceiptOptions
): PaymentOcrResult {
  const options: ParseReceiptOptions =
    typeof expectedCodeOrOptions === 'string' || expectedCodeOrOptions == null
      ? { expectedPaymentCode: expectedCodeOrOptions ?? undefined }
      : expectedCodeOrOptions;

  const text = rawText.toUpperCase();
  const foundIban = findIban(text);
  const shortCodes = [...text.matchAll(CODE_RE)].map((m) => m[1]);
  const regNos = [...text.matchAll(REG_NO_RE)].map((m) => m[1]);
  const allCodes = [...new Set([...shortCodes, ...regNos])];

  const expectedPayment = options.expectedPaymentCode?.toUpperCase().trim() || null;
  const expectedReg = options.expectedRegistrationNo?.toUpperCase().trim() || null;

  let code: string | null = null;
  if (expectedPayment && (allCodes.some((c) => c === expectedPayment) || textIncludesLoose(text, expectedPayment))) {
    code = expectedPayment;
  } else if (
    expectedReg &&
    (allCodes.some((c) => c === expectedReg) || textIncludesLoose(text, expectedReg))
  ) {
    code = expectedReg;
  } else if (allCodes.length) {
    code = allCodes[0] ?? null;
  }

  const amounts = collectAmounts(text);
  let amount: number | null = null;
  if (amounts.length) {
    const expected = options.expectedAmount;
    if (typeof expected === 'number') {
      amount = amounts.reduce((best, cur) =>
        Math.abs(cur - expected) < Math.abs(best - expected) ? cur : best
      );
    } else {
      amount = amounts.sort((a, b) => b - a)[0] ?? null;
    }
  }

  return {
    code,
    amount,
    iban: foundIban,
    dateText: null,
    rawText: rawText.slice(0, 4000),
  };
}

export function scoreReceiptMatch(
  rawText: string,
  options: ParseReceiptOptions
): ParsedReceiptMatch {
  const ocr = parseReceiptText(rawText, options);
  const text = rawText.toUpperCase();

  const expectedPayment = options.expectedPaymentCode?.toUpperCase().trim() || '';
  const expectedReg = options.expectedRegistrationNo?.toUpperCase().trim() || '';
  const codeMatched = Boolean(
    (expectedPayment &&
      (ocr.code === expectedPayment || textIncludesLoose(text, expectedPayment))) ||
      (expectedReg && (ocr.code === expectedReg || textIncludesLoose(text, expectedReg)))
  );

  const expectedAmount = options.expectedAmount;
  const amountMatched =
    typeof expectedAmount === 'number' &&
    ocr.amount != null &&
    Math.abs(ocr.amount - expectedAmount) <= 1;

  const expectedIban = normalizeIban(options.expectedIban);
  const foundIban = normalizeIban(ocr.iban);
  const ibanMatched = Boolean(
    expectedIban &&
      foundIban &&
      (foundIban === expectedIban || textIncludesLoose(text, expectedIban))
  );

  const hits = [codeMatched, amountMatched, ibanMatched].filter(Boolean).length;
  const confidence: MatchConfidence =
    hits === 3 ? 'strong' : hits >= 1 ? 'partial' : 'weak';

  return {
    ...ocr,
    codeMatched,
    amountMatched,
    ibanMatched,
    confidence,
    extractMethod: options.extractMethod ?? 'empty',
  };
}
