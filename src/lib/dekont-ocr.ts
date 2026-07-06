import 'server-only';

import { buildEnrichedOcrResult } from '@/lib/dekont-ocr-enrich';
import { sniffDekontContentKind } from '@/lib/dekont-ocr-parse';
import type { DekontOcrResult } from '@/lib/dekont-ocr-shared';
import { getGoogleVisionToken, isGoogleServiceAccountConfigured } from '@/lib/google-service-account';
import strings from '@json/src/lib/dekont-ocr.json';

export type { DekontOcrResult } from '@/lib/dekont-ocr-shared';
export { findBankKeywords } from '@/lib/dekont-ocr-shared';

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

type OcrProvider = 'auto' | 'tesseract' | 'vision';

function getOcrProvider(): OcrProvider {
  const value = process.env.DEKONT_OCR_PROVIDER?.trim().toLowerCase();
  if (value === 'tesseract' || value === 'vision') return value;
  return 'auto';
}

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

async function extractTextWithVision(buffer: Buffer, kind: 'pdf' | 'image'): Promise<string> {
  return kind === 'pdf' ? extractPdfTextWithVision(buffer) : extractImageTextWithVision(buffer);
}

export async function analyzeDekont(params: {
  buffer: Buffer;
  mimeType: string;
}): Promise<DekontOcrResult> {
  const kind = sniffDekontContentKind(params.buffer, params.mimeType);
  let rawText = '';
  let source: DekontOcrResult['source'] = 'none';
  let ocrError: string | null = null;

  const provider = getOcrProvider();
  const visionAvailable = isGoogleServiceAccountConfigured();

  if (kind === 'unknown') {
    ocrError = strings.unsupportedFileType;
  } else {
    const runTesseract = async () => {
      rawText = await extractTextWithTesseract(params.buffer, kind);
      source = 'tesseract';
      ocrError = null;
    };

    const runVision = async () => {
      rawText = await extractTextWithVision(params.buffer, kind);
      source = 'vision';
      ocrError = null;
    };

    try {
      if (provider === 'tesseract') {
        await runTesseract();
      } else if (provider === 'vision') {
        await runVision();
      } else {
        let usedTesseract = false;
        try {
          await runTesseract();
          usedTesseract = true;
        } catch (tessErr) {
          const tessMessage = tessErr instanceof Error ? tessErr.message : strings.tesseractFailed;
          if (!visionAvailable) {
            ocrError = tessMessage;
          } else {
            try {
              await runVision();
            } catch (visionErr) {
              ocrError = visionErr instanceof Error ? visionErr.message : strings.visionFailed;
            }
          }
        }

        if (usedTesseract && rawText.trim().length < 40 && visionAvailable) {
          try {
            const visionText = await extractTextWithVision(params.buffer, kind);
            if (visionText.trim().length > rawText.trim().length) {
              rawText = visionText;
              source = 'vision';
              ocrError = null;
            }
          } catch {
            // Tesseract sonucunu koru
          }
        }

        const preliminary = await buildEnrichedOcrResult(rawText, source, ocrError);
        if (
          !preliminary.amount &&
          visionAvailable &&
          preliminary.source === 'tesseract' &&
          rawText.trim().length >= 30
        ) {
          try {
            const visionText = await extractTextWithVision(params.buffer, kind);
            if (visionText.trim().length >= rawText.trim().length) {
              return buildEnrichedOcrResult(visionText, 'vision', null);
            }
          } catch {
            /* mevcut sonuç */
          }
        }
        return preliminary;
      }
    } catch (err) {
      ocrError = err instanceof Error ? err.message : strings.tesseractFailed;
      if (provider === 'vision' && kind === 'image') throw err;
    }
  }

  return buildEnrichedOcrResult(rawText, source, ocrError);
}
