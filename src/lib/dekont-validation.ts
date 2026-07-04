import type { DekontOcrResult } from '@/lib/dekont-ocr';
import { findBankKeywords } from '@/lib/dekont-ocr';
import { validateTurkishIban } from '@/lib/field-encryption';
import type { DekontMatchSuggestion } from '@/lib/advance-dekont-match';

export type DekontValidationCheck = {
  id: string;
  label: string;
  passed: boolean;
  detail?: string;
  required: boolean;
};

export type DekontValidationResult = {
  accepted: boolean;
  score: number;
  checks: DekontValidationCheck[];
  summary: string;
};

const MIN_TEXT_LENGTH = 55;
const MIN_BANK_KEYWORDS = 2;
export const MIN_TRUST_SCORE = 65;
export const MIN_MATCH_SCORE = 50;

export function validateDekontDocument(ocr: DekontOcrResult): DekontValidationResult {
  const keywords = findBankKeywords(ocr.rawText);
  const hasIban = Boolean(ocr.recipientIban && validateTurkishIban(ocr.recipientIban));
  const hasAmount = ocr.amount != null && ocr.amount > 0 && ocr.amount <= 1_000_000;
  const hasDate = Boolean(ocr.paymentDate);
  const hasReference = Boolean(ocr.referenceNo && ocr.referenceNo.length >= 4);
  const hasText = ocr.rawText.trim().length >= MIN_TEXT_LENGTH;
  const hasOcrSource = ocr.source !== 'none';
  const transferSignals = [hasIban, hasAmount, hasDate, hasReference].filter(Boolean).length;
  const bankContext = keywords.length >= MIN_BANK_KEYWORDS;
  const likelyTransfer = bankContext && transferSignals >= 2;

  const checks: DekontValidationCheck[] = [
    {
      id: 'readable',
      label: 'Belge okunabilir',
      passed: hasText && hasOcrSource,
      detail: hasText
        ? `${ocr.rawText.trim().length} karakter okundu`
        : 'Metin çıkarılamadı — net bir dekont/görsel yükleyin',
      required: true,
    },
    {
      id: 'bank_context',
      label: 'Banka / havale içeriği',
      passed: bankContext,
      detail: bankContext
        ? `${keywords.slice(0, 4).join(', ')}${keywords.length > 4 ? '…' : ''}`
        : 'Dekont, havale veya EFT ifadeleri bulunamadı',
      required: true,
    },
    {
      id: 'iban',
      label: 'Geçerli alıcı IBAN',
      passed: hasIban,
      detail: hasIban ? 'TR IBAN doğrulandı' : 'Geçerli alıcı IBAN okunamadı',
      required: true,
    },
    {
      id: 'amount',
      label: 'Transfer tutarı',
      passed: hasAmount,
      detail: hasAmount ? `${ocr.amount!.toLocaleString('tr-TR')} ₺` : 'Tutar tespit edilemedi',
      required: true,
    },
    {
      id: 'transfer_shape',
      label: 'Dekont yapısı (IBAN + tutar + tarih/referans)',
      passed: likelyTransfer && transferSignals >= 3,
      detail:
        transferSignals >= 3
          ? `${transferSignals}/4 alan eşleşti`
          : 'Eksik alanlar var — rastgele PDF kabul edilmez',
      required: true,
    },
    {
      id: 'reference',
      label: 'Referans / işlem no',
      passed: hasReference,
      detail: hasReference ? ocr.referenceNo! : 'Okunamadı (önerilir)',
      required: false,
    },
    {
      id: 'date',
      label: 'İşlem tarihi',
      passed: hasDate,
      detail: hasDate ? ocr.paymentDate! : 'Okunamadı (önerilir)',
      required: false,
    },
  ];

  let score = 0;
  if (hasText) score += 10;
  if (bankContext) score += 15;
  if (hasIban) score += 25;
  if (hasAmount) score += 25;
  if (transferSignals >= 3) score += 15;
  if (hasReference) score += 5;
  if (hasDate) score += 5;
  if (ocr.confidence === 'high') score += 5;
  else if (ocr.confidence === 'medium') score += 2;

  const requiredPassed = checks.filter((c) => c.required).every((c) => c.passed);
  const accepted = requiredPassed && score >= MIN_TRUST_SCORE;

  const summary = accepted
    ? 'Dekont doğrulandı — avans eşleştirmesine geçilebilir'
    : requiredPassed
      ? 'Güven skoru düşük — daha net bir dekont yükleyin'
      : 'Bu dosya banka dekontu olarak kabul edilemedi';

  return { accepted, score: Math.min(100, score), checks, summary };
}

export function validateMatchForConfirm(
  ocr: DekontOcrResult,
  match: DekontMatchSuggestion | null
): { ok: boolean; reason?: string } {
  const doc = validateDekontDocument(ocr);
  if (!doc.accepted) {
    return { ok: false, reason: doc.summary };
  }
  if (!match) {
    return { ok: false, reason: 'Onaylanacak avans talebi seçilmedi' };
  }
  if (match.score < MIN_MATCH_SCORE) {
    return {
      ok: false,
      reason: `Eşleşme skoru yetersiz (${match.score}/${MIN_MATCH_SCORE}). IBAN ve tutar uyumu şart.`,
    };
  }

  const ibanMatched = match.reasons.some((r) => r.includes('IBAN'));
  const amountMatched = match.reasons.some((r) => r.includes('Tutar uyumlu'));

  if (!ibanMatched) {
    return { ok: false, reason: 'Alıcı IBAN personel kaydıyla eşleşmedi — ödeme kaydedilemez' };
  }
  if (!amountMatched && ocr.amount != null) {
    const diff = Math.abs(ocr.amount - match.approvedAmount);
    if (diff > 1) {
      return {
        ok: false,
        reason: `Dekont tutarı (${ocr.amount} ₺) onaylı avans (${match.approvedAmount} ₺) ile uyuşmuyor`,
      };
    }
  }

  return { ok: true };
}
