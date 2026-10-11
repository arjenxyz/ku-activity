import fs from 'node:fs';
import path from 'node:path';
import type { ExtractMethod, MatchConfidence, PaymentOcrResult } from '@/lib/payments/types';

const CODE_RE = /\b([A-Z]{2,5}-[A-Z0-9]{3,8})\b/g;
const REG_NO_RE = /\b([A-Z]{2,5}-\d{4}-\d{4,8})\b/g;
const AMOUNT_RE =
  /(?:₺|TRY|TL)?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?|\d+)\s*(?:₺|TRY|TL)?/gi;
const LABELED_AMOUNT_RE =
  /(?:TUTAR|ODEME|ÖDEME|ISLEM|İŞLEM|HAVALE|TRANSFER|AMOUNT)[^\d]{0,48}(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?|\d+)/gi;

/** Strong bank-receipt cues — single generic words (BANKA, TUTAR) are not enough. */
const BANK_KEYWORDS = [
  'DEKONT',
  'HAVALE',
  'EFT',
  'FAST',
  'IBAN',
  'ALICI',
  'GONDEREN',
  'TRANSFER',
  'RECEIPT',
  'ODEME TUTARI',
  'ISLEM TUTARI',
  'ISLEM SONUCU',
] as const;

const MIN_PDF_TEXT_CHARS = 40;
/** Soft cap for the full extract pipeline (claims maxDuration is 60s). */
const EXTRACT_BUDGET_MS = 28_000;
const OCR_JOB_BUDGET_MS = 22_000;

export const RECEIPT_NOT_RECOGNIZED_ERROR =
  'Dosya dekont gibi görünmüyor. Banka dekontu (PDF/foto) yükleyin.';

export const RECEIPT_UNREADABLE_ERROR =
  'Dekont okunamadı. Daha net bir foto veya metin içeren PDF yükleyin.';

export type ReceiptExtractResult = {
  text: string;
  method: ExtractMethod;
  pageCount: number;
};

type TessWorker = Awaited<ReturnType<typeof import('tesseract.js').createWorker>>;

const globalOcr = globalThis as typeof globalThis & {
  __emsTessWorker?: TessWorker;
  __emsTessWorkerPromise?: Promise<TessWorker>;
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

/** Normalize OCR confusables for payment-code comparison. */
function normalizeOcrCode(value: string) {
  return compactAlnum(value).replace(/O/g, '0').replace(/[IL]/g, '1');
}

function textIncludesLoose(haystack: string, needle: string) {
  if (!needle) return false;
  const upper = haystack.toUpperCase();
  if (upper.includes(needle.toUpperCase())) return true;
  if (compactAlnum(haystack).includes(compactAlnum(needle))) return true;
  return normalizeOcrCode(haystack).includes(normalizeOcrCode(needle));
}

function codesMatch(a: string | null | undefined, b: string | null | undefined) {
  if (!a || !b) return false;
  if (a.toUpperCase() === b.toUpperCase()) return true;
  if (compactAlnum(a) === compactAlnum(b)) return true;
  return normalizeOcrCode(a) === normalizeOcrCode(b);
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
    if (parts[1] && parts[1].length <= 2) {
      const n = Number(parts[0].replace(/\D/g, ''));
      return Number.isFinite(n) ? n : null;
    }
    const n = Number(parts[0].replace(/\D/g, ''));
    return Number.isFinite(n) ? n : null;
  }
  if (/^\d+\.\d{2}$/.test(cleaned)) {
    const n = Number(cleaned);
    return Number.isFinite(n) ? Math.round(n) : null;
  }
  const n = Number(cleaned.replace(/\./g, '').replace(/[^\d]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function tessdataDir() {
  return path.join(process.cwd(), 'src', 'lib', 'payments', 'tessdata');
}

async function getOcrWorker(): Promise<TessWorker> {
  if (globalOcr.__emsTessWorker) return globalOcr.__emsTessWorker;
  if (!globalOcr.__emsTessWorkerPromise) {
    globalOcr.__emsTessWorkerPromise = (async () => {
      const { createWorker, PSM } = await import('tesseract.js');
      const langPath = tessdataDir();
      const turPath = path.join(langPath, 'tur.traineddata.gz');
      const engPath = path.join(langPath, 'eng.traineddata.gz');
      if (!fs.existsSync(turPath) || !fs.existsSync(engPath)) {
        throw new Error('Tessdata missing — run npm run tessdata:ensure');
      }
      // Local langPath (not URL) → Node adapter reads .gz from disk; no CDN.
      const worker = await createWorker('tur+eng', 1, {
        langPath,
        cachePath: langPath,
        cacheMethod: 'none',
        gzip: true,
        logger: () => undefined,
      });
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.AUTO,
        user_defined_dpi: '300',
        preserve_interword_spaces: '1',
      });
      return worker;
    })().catch((error) => {
      globalOcr.__emsTessWorkerPromise = undefined;
      throw error;
    });
  }
  globalOcr.__emsTessWorker = await globalOcr.__emsTessWorkerPromise;
  return globalOcr.__emsTessWorker;
}

async function preprocessForOcr(buffer: Buffer): Promise<Buffer> {
  try {
    const sharp = (await import('sharp')).default;
    const meta = await sharp(buffer).rotate().metadata();
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;
    const minSide = Math.min(width, height);
    const scale = minSide > 0 && minSide < 1200 ? 2 : 1;

    let pipeline = sharp(buffer).rotate().greyscale().normalize();
    if (scale > 1 && width > 0 && height > 0) {
      pipeline = pipeline.resize({
        width: Math.round(width * scale),
        height: Math.round(height * scale),
        kernel: 'lanczos3',
      });
    }
    return await pipeline.sharpen({ sigma: 1 }).png().toBuffer();
  } catch {
    return Buffer.from(buffer);
  }
}

async function ocrImageBuffer(buffer: Buffer): Promise<string> {
  try {
    const prepared = await preprocessForOcr(buffer);
    const worker = await getOcrWorker();
    const result = await withBudget(
      worker.recognize(prepared),
      { data: { text: '' } } as Awaited<ReturnType<TessWorker['recognize']>>,
      OCR_JOB_BUDGET_MS
    );
    return (result.data.text ?? '').trim();
  } catch {
    return '';
  }
}

async function rasterizePdfFirstPage(buffer: Buffer): Promise<{ png: Buffer; pageCount: number } | null> {
  try {
    const mupdf = await import('mupdf');
    const doc = mupdf.Document.openDocument(buffer, 'application/pdf');
    const pageCount = doc.countPages();
    if (pageCount < 1) return null;
    const page = doc.loadPage(0);
    // ~180 DPI (72 * 2.5)
    const matrix = mupdf.Matrix.scale(2.5, 2.5);
    const pixmap = page.toPixmap(matrix, mupdf.ColorSpace.DeviceRGB, false, true);
    return { png: Buffer.from(pixmap.asPNG()), pageCount };
  } catch {
    return null;
  }
}

async function extractPdf(buffer: Buffer): Promise<ReceiptExtractResult> {
  let pageCount = 0;
  try {
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: buffer });
    try {
      const textResult = await parser.getText({ first: 1, last: 2 });
      const text = (textResult.text ?? '').trim();
      pageCount =
        typeof textResult.total === 'number'
          ? textResult.total
          : Array.isArray(textResult.pages)
            ? textResult.pages.length
            : 1;

      if (text.replace(/\s+/g, ' ').length >= MIN_PDF_TEXT_CHARS) {
        return { text, method: 'pdf-text', pageCount };
      }
    } finally {
      await parser.destroy().catch(() => undefined);
    }
  } catch {
    // fall through to raster OCR
  }

  const raster = await rasterizePdfFirstPage(buffer);
  if (!raster) {
    return { text: '', method: 'empty', pageCount: pageCount || 0 };
  }
  const ocrText = await ocrImageBuffer(raster.png);
  return {
    text: ocrText,
    method: ocrText ? 'ocr' : 'empty',
    pageCount: raster.pageCount || pageCount || 1,
  };
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
    const text = await ocrImageBuffer(buffer);
    return { text, method: text ? 'ocr' : 'empty', pageCount: 1 };
  }

  return { text: '', method: 'empty', pageCount: 0 };
}

/**
 * Extract text from receipt PDF/image for matching.
 * Never throws — empty/timeout falls through to gate evaluation.
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

function collectLabeledAmounts(text: string): number[] {
  const amounts: number[] = [];
  for (const match of text.matchAll(LABELED_AMOUNT_RE)) {
    const parsed = parseAmount(match[1] ?? '');
    if (parsed != null && parsed >= 10 && parsed <= 1_000_000) amounts.push(parsed);
  }
  return amounts;
}

function pickAmount(text: string, expected?: number | null): number | null {
  const labeled = collectLabeledAmounts(text);
  const all = collectAmounts(text);
  const pool = labeled.length ? labeled : all;
  if (!pool.length) return null;
  if (typeof expected === 'number') {
    return pool.reduce((best, cur) =>
      Math.abs(cur - expected) < Math.abs(best - expected) ? cur : best
    );
  }
  return pool.sort((a, b) => b - a)[0] ?? null;
}

function normalizeReceiptText(rawText: string) {
  return rawText
    .toUpperCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/İ/g, 'I')
    .replace(/Ş/g, 'S')
    .replace(/Ğ/g, 'G')
    .replace(/Ü/g, 'U')
    .replace(/Ö/g, 'O')
    .replace(/Ç/g, 'C');
}

/** True when OCR text has strong bank-receipt signals (even if fields don't match). */
export function looksLikeBankReceipt(rawText: string): boolean {
  const text = (rawText || '').trim();
  if (!text) return false;
  if (findIban(text)) return true;
  const normalized = normalizeReceiptText(text);
  let hits = 0;
  for (const keyword of BANK_KEYWORDS) {
    if (normalized.includes(keyword)) hits += 1;
    if (hits >= 2) return true;
  }
  return (
    normalized.includes('DEKONT') ||
    normalized.includes('HAVALE') ||
    normalized.includes('IBAN')
  );
}

/**
 * Decide whether a weak/empty extract may enter the admin queue.
 * Empty PDF is no longer auto-accepted — raster OCR must produce signals.
 */
export function evaluateReceiptUpload(input: {
  confidence: MatchConfidence;
  text: string;
  method: ExtractMethod;
  mime: string;
  pageCount: number;
}): { accept: true } | { accept: false; error: string } {
  if (input.confidence === 'strong' || input.confidence === 'partial') {
    return { accept: true };
  }

  const unreadable = !input.text.trim() || input.method === 'empty';
  if (unreadable) {
    return { accept: false, error: RECEIPT_UNREADABLE_ERROR };
  }

  if (looksLikeBankReceipt(input.text)) return { accept: true };
  return { accept: false, error: RECEIPT_NOT_RECOGNIZED_ERROR };
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
  if (
    expectedPayment &&
    (allCodes.some((c) => codesMatch(c, expectedPayment)) || textIncludesLoose(text, expectedPayment))
  ) {
    code = expectedPayment;
  } else if (
    expectedReg &&
    (allCodes.some((c) => codesMatch(c, expectedReg)) || textIncludesLoose(text, expectedReg))
  ) {
    code = expectedReg;
  } else if (allCodes.length) {
    code = allCodes[0] ?? null;
  }

  return {
    code,
    amount: pickAmount(text, options.expectedAmount),
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
      (codesMatch(ocr.code, expectedPayment) || textIncludesLoose(text, expectedPayment))) ||
      (expectedReg && (codesMatch(ocr.code, expectedReg) || textIncludesLoose(text, expectedReg)))
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
