import { parseIbanFromText, validateTurkishIban, normalizeIban } from '@/lib/field-encryption';
import { getGoogleVisionToken } from '@/lib/google-service-account';
import {
  bankNameFromIban,
  detectBankFromText,
  detectTransferType,
  type TransferType,
} from '@/lib/turkish-banks';
import strings from '@json/src/lib/dekont-ocr.json';

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
  source: 'pdf' | 'vision' | 'none';
  bankKeywords?: string[];
  isLikelyTransfer?: boolean;
  ocrError?: string | null;
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

function sniffContentKind(buffer: Buffer, mimeType: string): 'pdf' | 'image' | 'unknown' {
  if (buffer.length >= 4 && buffer.slice(0, 4).toString() === '%PDF') return 'pdf';
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xd8) return 'image';
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'image';
  }
  const mime = mimeType.toLowerCase();
  if (mime === 'application/pdf') return 'pdf';
  if (mime.startsWith('image/')) return 'image';
  return 'unknown';
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: buffer });
  try {
    const textResult = await parser.getText();
    return textResult.text ?? '';
  } finally {
    await parser.destroy();
  }
}

async function extractImageTextWithVision(buffer: Buffer): Promise<string> {
  const token = await getGoogleVisionToken();
  const res = await fetch('https://vision.googleapis.com/v1/images:annotate', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          image: { content: buffer.toString('base64') },
          features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
          imageContext: { languageHints: ['tr', 'en'] },
        },
      ],
    }),
  });

  const data = (await res.json()) as {
    responses?: Array<{
      fullTextAnnotation?: { text?: string };
      error?: { message?: string };
    }>;
    error?: { message?: string };
  };

  if (!res.ok) {
    throw new Error(data.error?.message || strings.visionFailed);
  }

  const text = data.responses?.[0]?.fullTextAnnotation?.text ?? '';
  if (!text && data.responses?.[0]?.error?.message) {
    throw new Error(data.responses[0].error.message);
  }
  return text;
}

/** Görsel tabanlı PDF dekontlar — files:annotate (PDF destekli) */
async function extractPdfTextWithVision(buffer: Buffer): Promise<string> {
  const token = await getGoogleVisionToken();
  const res = await fetch('https://vision.googleapis.com/v1/files:annotate', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          inputConfig: {
            mimeType: 'application/pdf',
            content: buffer.toString('base64'),
          },
          features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
          pages: [1, 2, 3],
        },
      ],
    }),
  });

  const data = (await res.json()) as {
    responses?: Array<{
      responses?: Array<{
        fullTextAnnotation?: { text?: string };
        error?: { message?: string };
      }>;
      error?: { message?: string };
    }>;
    error?: { message?: string };
  };

  if (!res.ok) {
    throw new Error(data.error?.message || strings.visionFailed);
  }

  const batchError = data.responses?.[0]?.error?.message;
  if (batchError) throw new Error(batchError);

  const pages = data.responses?.[0]?.responses ?? [];
  const texts = pages
    .map((page) => page.fullTextAnnotation?.text?.trim())
    .filter((text): text is string => Boolean(text));

  if (!texts.length) {
    const pageError = pages.find((page) => page.error?.message)?.error?.message;
    throw new Error(pageError || strings.visionPdfEmpty);
  }

  return texts.join('\n\n');
}

export async function analyzeDekont(params: {
  buffer: Buffer;
  mimeType: string;
}): Promise<DekontOcrResult> {
  const kind = sniffContentKind(params.buffer, params.mimeType);
  let rawText = '';
  let source: DekontOcrResult['source'] = 'none';
  let ocrError: string | null = null;

  try {
    if (kind === 'pdf') {
      rawText = await extractPdfText(params.buffer);
      source = 'pdf';
      if (rawText.trim().length < 40) {
        try {
          rawText = await extractPdfTextWithVision(params.buffer);
          source = 'vision';
        } catch (err) {
          ocrError = err instanceof Error ? err.message : strings.visionFailed;
        }
      }
    } else if (kind === 'image') {
      rawText = await extractImageTextWithVision(params.buffer);
      source = 'vision';
    } else {
      ocrError = strings.unsupportedFileType;
    }
  } catch (err) {
    ocrError = err instanceof Error ? err.message : strings.visionFailed;
    if (kind === 'image') throw err;
  }

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
