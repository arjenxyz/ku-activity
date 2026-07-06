import 'server-only';

import { buildOcrResultFromRawText } from '@/lib/dekont-ocr-parse';
import type { DekontOcrResult } from '@/lib/dekont-ocr-shared';
import { extractDekontFieldsWithLlm, isDekontLlmAvailable } from '@/lib/dekont-ocr-llm';

function needsEnrichment(ocr: DekontOcrResult): boolean {
  return !ocr.amount || !ocr.recipientIban;
}

function mergeLlmFields(ocr: DekontOcrResult, llm: Awaited<ReturnType<typeof extractDekontFieldsWithLlm>>): DekontOcrResult {
  if (!llm) return ocr;

  return {
    ...ocr,
    amount: ocr.amount ?? llm.amount,
    recipientIban: ocr.recipientIban ?? llm.recipientIban,
    paymentDate: ocr.paymentDate ?? llm.paymentDate,
    referenceNo: ocr.referenceNo ?? llm.referenceNo,
    allIbans:
      ocr.recipientIban || !llm.recipientIban
        ? ocr.allIbans
        : [...new Set([...ocr.allIbans, llm.recipientIban])],
  };
}

/** Regex parse eksik kaldığında yapılandırılmış alan çıkarımı */
export async function buildEnrichedOcrResult(
  rawText: string,
  source: DekontOcrResult['source'] = 'tesseract',
  ocrError: string | null = null
): Promise<DekontOcrResult> {
  const ocr = buildOcrResultFromRawText(rawText, source, ocrError);

  if (!needsEnrichment(ocr) || !isDekontLlmAvailable()) {
    return ocr;
  }

  const llm = await extractDekontFieldsWithLlm(rawText);
  return mergeLlmFields(ocr, llm);
}
