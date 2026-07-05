import { formatOcrIban, type DekontMatchSuggestion } from '@/lib/advance-dekont-match';
import type { DekontOcrResult } from '@/lib/dekont-ocr';
import { findBankKeywords } from '@/lib/dekont-ocr';
import { validateTurkishIban } from '@/lib/field-encryption';
import { formatString } from '@/lib/strings/format';
import strings from '@json/src/lib/dekont-validation.json';

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
      label: strings.checks.readable.label,
      passed: hasText && hasOcrSource,
      detail: hasText
        ? formatString(strings.checks.readable.detailChars, { count: ocr.rawText.trim().length })
        : strings.checks.readable.detailFailed,
      required: true,
    },
    {
      id: 'bank_context',
      label: strings.checks.bankContext.label,
      passed: bankContext,
      detail: bankContext
        ? `${keywords.slice(0, 4).join(', ')}${keywords.length > 4 ? '…' : ''}`
        : strings.checks.bankContext.detailFailed,
      required: true,
    },
    {
      id: 'iban',
      label: strings.checks.iban.label,
      passed: hasIban,
      detail: hasIban ? strings.checks.iban.detailPassed : strings.checks.iban.detailFailed,
      required: true,
    },
    {
      id: 'amount',
      label: strings.checks.amount.label,
      passed: hasAmount,
      detail: hasAmount
        ? formatString(strings.checks.amount.detailAmount, {
            amount: ocr.amount!.toLocaleString('tr-TR'),
          })
        : strings.checks.amount.detailFailed,
      required: true,
    },
    {
      id: 'transfer_shape',
      label: strings.checks.transferShape.label,
      passed: likelyTransfer && transferSignals >= 3,
      detail:
        transferSignals >= 3
          ? formatString(strings.checks.transferShape.detailPassed, { count: transferSignals })
          : transferSignals > 0
            ? formatString(strings.checks.transferShape.detailMissing, {
                fields: [
                  !hasIban ? 'IBAN' : null,
                  !hasAmount ? 'tutar' : null,
                  !hasDate ? 'tarih' : null,
                  !hasReference ? 'referans' : null,
                ]
                  .filter(Boolean)
                  .join(', '),
              })
            : strings.checks.transferShape.detailFailed,
      required: true,
    },
    {
      id: 'reference',
      label: strings.checks.reference.label,
      passed: hasReference,
      detail: hasReference ? ocr.referenceNo! : strings.checks.reference.detailFailed,
      required: false,
    },
    {
      id: 'date',
      label: strings.checks.date.label,
      passed: hasDate,
      detail: hasDate ? ocr.paymentDate! : strings.checks.date.detailFailed,
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
    ? strings.summary.accepted
    : requiredPassed
      ? strings.summary.lowScore
      : strings.summary.rejected;

  return { accepted, score: Math.min(100, score), checks, summary };
}

/** Başarısız doğrulama için kullanıcıya yönelik açıklama */
export function formatDekontValidationFailure(
  result: DekontValidationResult,
  ocr?: Pick<DekontOcrResult, 'rawText' | 'source' | 'recipientIban' | 'amount'>
): string {
  const { failedRequired } = splitValidationChecks(result.checks);
  const lines: string[] = [result.summary];

  const charCount = ocr?.rawText?.trim().length ?? 0;
  const found: string[] = [];
  if (charCount > 0) {
    found.push(formatString(strings.rejection.foundChars, { count: String(charCount) }));
  } else {
    found.push(strings.rejection.foundNothing);
  }
  if (ocr?.recipientIban) {
    found.push(formatString(strings.rejection.foundIban, { iban: formatOcrIban(ocr.recipientIban) }));
  }
  if (ocr?.amount != null && ocr.amount > 0) {
    found.push(formatString(strings.rejection.foundAmount, { amount: ocr.amount.toLocaleString('tr-TR') }));
  }

  if (found.length > 0) {
    lines.push('', strings.rejection.foundHeader, ...found.map((f) => `• ${f}`));
  }

  if (failedRequired.length > 0) {
    lines.push('', strings.rejection.issuesHeader);
    for (const check of failedRequired) {
      lines.push(
        formatString(strings.rejection.bullet, {
          label: check.label,
          detail: check.detail ?? '—',
        })
      );
    }
  }

  const unreadable = failedRequired.some((c) => c.id === 'readable');
  const partialRead =
    !unreadable &&
    failedRequired.some((c) => c.id === 'iban' || c.id === 'amount' || c.id === 'bank_context');

  if (unreadable || charCount < MIN_TEXT_LENGTH || ocr?.source === 'none') {
    lines.push('', strings.rejection.tipUnreadable);
  } else if (partialRead) {
    lines.push('', strings.rejection.tipPartialRead);
  } else if (!result.accepted && failedRequired.length === 0) {
    lines.push(
      '',
      formatString(strings.rejection.tipLowScore, {
        score: String(result.score),
        minScore: String(MIN_TRUST_SCORE),
      })
    );
  }

  return lines.join('\n');
}

export function splitValidationChecks(checks: DekontValidationCheck[]) {
  const passed = checks.filter((c) => c.passed);
  const failed = checks.filter((c) => !c.passed);
  const failedRequired = failed.filter((c) => c.required);
  const failedOptional = failed.filter((c) => !c.required);
  return { passed, failed, failedRequired, failedOptional };
}

/** Avans eşleştirmesi + onay koşulları — belge kontrollerinden ayrı detay listesi */
export function buildMatchValidationChecks(
  ocr: DekontOcrResult,
  match: DekontMatchSuggestion | null
): DekontValidationCheck[] {
  const doc = validateDekontDocument(ocr);
  const checks: DekontValidationCheck[] = [
    {
      id: 'doc_accepted',
      label: strings.match.docAccepted.label,
      passed: doc.accepted,
      detail: doc.summary,
      required: true,
    },
  ];

  if (!match) {
    checks.push({
      id: 'match_selected',
      label: strings.match.matchSelected.label,
      passed: false,
      detail: strings.match.matchSelected.detailFailed,
      required: true,
    });
    return checks;
  }

  const ibanMatched = match.reasons.some((r) => r.includes('IBAN'));
  const amountMatched = match.reasons.some((r) => r.includes('Tutar uyumlu'));
  const amountCloseEnough =
    amountMatched ||
    (ocr.amount != null && Math.abs(ocr.amount - match.approvedAmount) <= 1);
  const scoreOk = match.score >= MIN_MATCH_SCORE;

  checks.push(
    {
      id: 'match_selected',
      label: strings.match.matchSelected.label,
      passed: true,
      detail: formatString(strings.match.matchSelected.detailPassed, {
        employeeName: match.employeeName,
        projectSuffix: match.projectName ? ` · ${match.projectName}` : '',
      }),
      required: true,
    },
    {
      id: 'iban_match',
      label: strings.match.ibanMatch.label,
      passed: ibanMatched,
      detail: ibanMatched
        ? formatOcrIban(ocr.recipientIban)
        : ocr.recipientIban
          ? formatString(strings.match.ibanMatch.detailMismatch, {
              iban: formatOcrIban(ocr.recipientIban),
            })
          : strings.match.ibanMatch.detailNoIban,
      required: true,
    },
    {
      id: 'amount_match',
      label: strings.match.amountMatch.label,
      passed: amountCloseEnough,
      detail:
        ocr.amount != null
          ? formatString(strings.match.amountMatch.detailCompare, {
              ocrAmount: ocr.amount.toLocaleString('tr-TR'),
              approvedAmount: match.approvedAmount.toLocaleString('tr-TR'),
            })
          : strings.match.amountMatch.detailFailed,
      required: true,
    },
    {
      id: 'match_score',
      label: formatString(strings.match.matchScore.label, { minScore: MIN_MATCH_SCORE }),
      passed: scoreOk,
      detail: scoreOk
        ? formatString(strings.match.matchScore.detailPassed, { score: match.score })
        : formatString(strings.match.matchScore.detailFailed, {
            score: match.score,
            minScore: MIN_MATCH_SCORE,
          }),
      required: true,
    }
  );

  const optionalReasons = match.reasons.filter(
    (r) => !r.includes('IBAN') && !r.includes('Tutar uyumlu')
  );
  for (const reason of optionalReasons) {
    checks.push({
      id: `bonus_${reason.slice(0, 12)}`,
      label: reason,
      passed: true,
      detail: strings.match.bonusDetail,
      required: false,
    });
  }

  return checks;
}

export function validateMatchForConfirm(
  ocr: DekontOcrResult,
  match: DekontMatchSuggestion | null
): { ok: boolean; reason?: string } {
  const doc = validateDekontDocument(ocr);
  if (!doc.accepted) {
    return { ok: false, reason: formatDekontValidationFailure(doc, ocr) };
  }
  if (!match) {
    return { ok: false, reason: strings.confirm.noMatchSelected };
  }
  if (match.score < MIN_MATCH_SCORE) {
    return {
      ok: false,
      reason: formatString(strings.confirm.scoreInsufficient, {
        score: match.score,
        minScore: MIN_MATCH_SCORE,
      }),
    };
  }

  const ibanMatched = match.reasons.some((r) => r.includes('IBAN'));
  const amountMatched = match.reasons.some((r) => r.includes('Tutar uyumlu'));

  if (!ibanMatched) {
    return { ok: false, reason: strings.confirm.ibanMismatch };
  }
  if (!amountMatched && ocr.amount != null) {
    const diff = Math.abs(ocr.amount - match.approvedAmount);
    if (diff > 1) {
      return {
        ok: false,
        reason: formatString(strings.confirm.amountMismatch, {
          ocrAmount: ocr.amount,
          approvedAmount: match.approvedAmount,
        }),
      };
    }
  }

  return { ok: true };
}
