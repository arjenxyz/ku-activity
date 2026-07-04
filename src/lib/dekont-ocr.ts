import { parseIbanFromText, validateTurkishIban, normalizeIban } from '@/lib/field-encryption';
import { getGoogleVisionToken } from '@/lib/google-service-account';

export type DekontOcrResult = {
  rawText: string;
  recipientIban: string | null;
  allIbans: string[];
  amount: number | null;
  referenceNo: string | null;
  paymentDate: string | null;
  confidence: 'high' | 'medium' | 'low';
  source: 'pdf' | 'vision' | 'none';
};

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

function pickRecipientIban(ibans: string[]): string | null {
  if (ibans.length === 0) return null;
  if (ibans.length === 1) return ibans[0]!;
  return ibans[ibans.length - 1] ?? ibans[0]!;
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
    throw new Error(data.error?.message || 'Vision OCR başarısız — Cloud Vision API etkin mi?');
  }

  const text = data.responses?.[0]?.fullTextAnnotation?.text ?? '';
  if (!text && data.responses?.[0]?.error?.message) {
    throw new Error(data.responses[0].error.message);
  }
  return text;
}

export async function analyzeDekont(params: {
  buffer: Buffer;
  mimeType: string;
}): Promise<DekontOcrResult> {
  const mime = params.mimeType.toLowerCase();
  let rawText = '';
  let source: DekontOcrResult['source'] = 'none';

  try {
    if (mime === 'application/pdf' || params.buffer.slice(0, 4).toString() === '%PDF') {
      rawText = await extractPdfText(params.buffer);
      source = 'pdf';
      if (rawText.trim().length < 40) {
        rawText = await extractImageTextWithVision(params.buffer);
        source = 'vision';
      }
    } else if (mime.startsWith('image/')) {
      rawText = await extractImageTextWithVision(params.buffer);
      source = 'vision';
    }
  } catch (err) {
    if (mime.startsWith('image/')) throw err;
    rawText = '';
  }

  const allIbans = extractIbans(rawText);
  const recipientIban = pickRecipientIban(allIbans);
  const amount = parseTurkishAmount(rawText);
  const referenceNo = parseReferenceNo(rawText);
  const paymentDate = parsePaymentDate(rawText);

  const base = {
    rawText: rawText.slice(0, 12000),
    recipientIban,
    allIbans,
    amount,
    referenceNo,
    paymentDate,
    source,
  };

  return { ...base, confidence: scoreConfidence(base) };
}
