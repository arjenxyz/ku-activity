import type { PaymentOcrResult } from '@/lib/payments/types';

const IBAN_RE = /\bTR\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{2}\b/i;
const CODE_RE = /\b([A-Z]{2,5}-[A-Z0-9]{3,6})\b/g;
const AMOUNT_RE =
  /(?:₺|TRY|TL)?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?|\d+)\s*(?:₺|TRY|TL)?/gi;

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/\s/g, '').replace(/₺|TRY|TL/gi, '');
  if (cleaned.includes(',') && cleaned.includes('.')) {
    const normalized = cleaned.replace(/\./g, '').replace(',', '.');
    const n = Number(normalized);
    return Number.isFinite(n) ? Math.round(n) : null;
  }
  if (cleaned.includes(',')) {
    const parts = cleaned.split(',');
    const n = Number(parts[0].replace(/\D/g, ''));
    return Number.isFinite(n) ? n : null;
  }
  const n = Number(cleaned.replace(/\./g, '').replace(/[^\d]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Parse bank-receipt-like text for payment code, amount, IBAN. */
export function parseReceiptText(rawText: string, expectedCode?: string): PaymentOcrResult {
  const text = rawText.toUpperCase();
  const ibanMatch = text.match(IBAN_RE);
  const codes = [...text.matchAll(CODE_RE)].map((m) => m[1]);
  let code: string | null = null;
  if (expectedCode && codes.some((c) => c === expectedCode.toUpperCase())) {
    code = expectedCode.toUpperCase();
  } else if (codes.length) {
    code = codes[0];
  }

  let amount: number | null = null;
  const amounts: number[] = [];
  for (const match of text.matchAll(AMOUNT_RE)) {
    const parsed = parseAmount(match[1] ?? '');
    if (parsed != null && parsed >= 10) amounts.push(parsed);
  }
  if (amounts.length) {
    amount = amounts.sort((a, b) => b - a)[0] ?? null;
  }

  return {
    code,
    amount,
    iban: ibanMatch ? ibanMatch[0].replace(/\s/g, '') : null,
    dateText: null,
    rawText: rawText.slice(0, 4000),
  };
}

/**
 * Lightweight OCR for demo: prefer Tesseract when available; otherwise
 * treat UTF-8 text payloads / filename hints. Never throws.
 */
export async function extractReceiptText(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType.startsWith('text/') || mimeType === 'application/json') {
    return buffer.toString('utf8');
  }

  try {
    const Tesseract = await import('tesseract.js');
    const result = await Tesseract.recognize(buffer, 'eng+tur', {
      logger: () => undefined,
    });
    return result.data.text ?? '';
  } catch {
    // Fallback: no OCR engine — admin still reviews the image visually.
    return '';
  }
}
