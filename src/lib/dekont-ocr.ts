import 'server-only';

import { buildEnrichedOcrResult } from '@/lib/dekont-ocr-enrich';
import { sniffDekontContentKind } from '@/lib/dekont-ocr-parse';
import type { DekontOcrResult } from '@/lib/dekont-ocr-shared';
import strings from '@json/src/lib/dekont-ocr.json';

export type { DekontOcrResult } from '@/lib/dekont-ocr-shared';
export { findBankKeywords } from '@/lib/dekont-ocr-shared';

async function extractTextWithTesseract(buffer: Buffer, kind: 'pdf' | 'image'): Promise<string> {
  const { ocrImagesWithTesseract, rasterizePdfPages } = await import('@/lib/dekont-ocr-tesseract');
  const images = kind === 'pdf' ? await rasterizePdfPages(buffer) : [buffer];
  if (!images.length) {
    throw new Error(strings.tesseractPdfEmpty);
  }
  const text = await ocrImagesWithTesseract(images);
  if (!text.trim()) {
    throw new Error(strings.tesseractFailed);
  }
  return text;
}

/** Dekont OCR — yalnızca Tesseract (sunucu). Vision kullanılmaz. */
export async function analyzeDekont(params: {
  buffer: Buffer;
  mimeType: string;
}): Promise<DekontOcrResult> {
  const kind = sniffDekontContentKind(params.buffer, params.mimeType);
  let rawText = '';
  let source: DekontOcrResult['source'] = 'none';
  let ocrError: string | null = null;

  if (kind === 'unknown') {
    ocrError = strings.unsupportedFileType;
  } else {
    try {
      rawText = await extractTextWithTesseract(params.buffer, kind);
      source = 'tesseract';
    } catch (err) {
      ocrError = err instanceof Error ? err.message : strings.tesseractFailed;
    }
  }

  return buildEnrichedOcrResult(rawText, source, ocrError);
}
