'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dayjs from 'dayjs';
import {
  FiAlertTriangle,
  FiCheck,
  FiCheckCircle,
  FiFileText,
  FiRefreshCw,
  FiUpload,
  FiUser,
  FiXCircle,
} from 'react-icons/fi';
import { AlertBanner } from '@/components/project/AlertBanner';
import { DekontScanShell } from '@/components/admin/DekontScanShell';
import { EmployeeAvatar } from '@/components/employee/EmployeeAvatar';
import { btnPrimary, btnSecondary, labelClass, inputClass } from '@/components/project/ui';
import { formatDate, formatMoney } from '@/lib/format';
import { formatString } from '@/lib/strings/format';
import { getRegistryStrings } from '@/lib/i18n/strings-registry';
import { formatOcrIban } from '@/lib/advance-dekont-match';
import type { DekontMatchSuggestion, IbanEmployeeSuggestion } from '@/lib/advance-dekont-match';
import type { DekontOcrResult } from '@/lib/dekont-ocr-shared';
import { isDraftPendingOcr } from '@/lib/dekont-ocr-shared';
import {
  MIN_MATCH_SCORE,
  buildMatchValidationChecks,
  splitValidationChecks,
  validateDekontDocument,
  validateMatchForConfirm,
  validateRetroactivePayment,
  type DekontValidationCheck,
} from '@/lib/dekont-validation';
import { decodeScanReport, type DekontScanReport } from '@/lib/dekont-scan-report';

type DraftPayload = {
  id: string;
  ocr_json: DekontOcrResult;
  match_json: DekontMatchSuggestion[];
  proof_file_name: string;
  ibanEmployeeSuggestions?: IbanEmployeeSuggestion[];
};

type Step = 'upload' | 'analyze' | 'review' | 'done';

function StepIndicator({ step }: { step: Step }) {
  const strings = useRegistryStrings('components/admin/DekontSharePanel');
  const steps: { id: Step; label: string }[] = [
    { id: 'upload', label: strings.steps.upload },
    { id: 'analyze', label: strings.steps.analyze },
    { id: 'review', label: strings.steps.review },
  ];
  const idx = step === 'upload' ? 0 : step === 'analyze' ? 1 : step === 'review' ? 2 : 3;

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {steps.map((s, i) => {
        const active = i === idx;
        const done = i < idx || step === 'done';
        return (
          <div key={s.id} className="flex flex-1 min-w-0 items-center gap-1.5 sm:gap-2">
            {i > 0 && (
              <div
                className={`h-px w-3 shrink-0 sm:w-6 ${done ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'}`}
              />
            )}
            <div
              className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-2 py-1.5 text-[11px] font-medium sm:px-3 sm:text-xs ${
                done
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300'
                  : active
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
              }`}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black/10 text-[10px] font-bold">
                {done ? <FiCheck className="h-3 w-3" /> : i + 1}
              </span>
              <span className="hidden truncate sm:inline">{s.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ScorePill({ score, ok }: { score: number; ok: boolean }) {
  const strings = useRegistryStrings('components/admin/DekontSharePanel');
  return (
    <div
      className={`shrink-0 rounded-full px-3 py-1 text-center text-xs font-semibold tabular-nums ${
        ok
          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
          : score >= 40
            ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
            : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200'
      }`}
    >
      {score}
      <span className="ml-1 font-normal opacity-70">{strings.trustLabel}</span>
    </div>
  );
}

function MatchScoreBadge({ score }: { score: number }) {
  const ok = score >= MIN_MATCH_SCORE;
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${
        ok
          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
          : 'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
      }`}
    >
      {score}
    </span>
  );
}

function PersonnelMatchCard({
  match,
  selected,
  ocr,
  onSelect,
}: {
  match: DekontMatchSuggestion;
  selected: boolean;
  ocr: DekontOcrResult;
  onSelect: () => void;
}) {
  const strings = useRegistryStrings('components/admin/DekontSharePanel');

  return (
    <label
      className={`block cursor-pointer rounded-xl border p-3.5 transition-all sm:p-4 ${
        selected
          ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900/10 dark:border-white dark:bg-slate-800 dark:ring-white/10'
          : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
      }`}
    >
      <input type="radio" name="match" className="sr-only" checked={selected} onChange={onSelect} />
      <div className="flex items-center gap-3">
        <EmployeeAvatar
          name={match.employeeName}
          photoUrl={match.employeePhotoUrl}
          size="md"
          className="ring-2 ring-white dark:ring-slate-900"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900 dark:text-white">{match.employeeName}</p>
              <p className="truncate text-xs text-slate-500">
                {match.projectName} · {formatMoney(match.approvedAmount)}
              </p>
            </div>
            <MatchScoreBadge score={match.score} />
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-medium">
            <span
              className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 ${
                match.ibanMatched
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
              }`}
            >
              {match.ibanMatched ? <FiCheck className="h-3 w-3" /> : <FiXCircle className="h-3 w-3" />}
              IBAN
            </span>
            <span
              className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 ${
                match.amountMatched
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
              }`}
            >
              {match.amountMatched ? <FiCheck className="h-3 w-3" /> : <FiXCircle className="h-3 w-3" />}
              {strings.review.amountMatch}
            </span>
            {match.expectedTransferToken && (
              <span
                className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 ${
                  match.transferTokenMatched
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                }`}
              >
                {match.transferTokenMatched ? <FiCheck className="h-3 w-3" /> : <FiXCircle className="h-3 w-3" />}
                HVL
              </span>
            )}
            {ocr.amount != null && !match.amountMatched && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                OCR {formatMoney(ocr.amount)}
              </span>
            )}
          </div>
        </div>
      </div>
    </label>
  );
}

type ValidationLibStrings = ReturnType<typeof getRegistryStrings<'lib/dekont-validation'>>;

const CHECK_ID_TO_KEY: Record<string, keyof ValidationLibStrings['checks']> = {
  readable: 'readable',
  bank_context: 'bankContext',
  iban: 'iban',
  amount: 'amount',
  transfer_shape: 'transferShape',
  reference: 'reference',
  date: 'date',
};

function localizeValidationCheck(
  check: DekontValidationCheck,
  validationStrings: ValidationLibStrings
): DekontValidationCheck {
  const key = CHECK_ID_TO_KEY[check.id];
  if (!key) return check;

  const defs = validationStrings.checks[key];
  const label = defs.label;

  if (check.passed) {
    if (check.id === 'iban' && 'detailPassed' in defs) {
      return { ...check, label, detail: defs.detailPassed ?? check.detail };
    }
    return { ...check, label };
  }

  if (check.id === 'transfer_shape' && check.detail?.includes(':')) {
    return { ...check, label };
  }

  const detailFailed = 'detailFailed' in defs ? defs.detailFailed : check.detail;
  return { ...check, label, detail: detailFailed ?? check.detail };
}

function localizeValidationChecks(
  checks: DekontValidationCheck[],
  validationStrings: ValidationLibStrings
) {
  return checks.map((check) => localizeValidationCheck(check, validationStrings));
}

function CompactValidationIssues({ checks }: { checks: DekontValidationCheck[] }) {
  const validationStrings = useRegistryStrings('lib/dekont-validation');
  const localized = localizeValidationChecks(checks, validationStrings);
  const { failedRequired, failedOptional } = splitValidationChecks(localized);
  const issues = [...failedRequired, ...failedOptional];

  if (issues.length === 0) return null;

  return (
    <ul className="mt-3 space-y-1.5">
      {issues.map((check) => (
        <li
          key={check.id}
          className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${
            check.required
              ? 'bg-red-50 text-red-900 dark:bg-red-950/20 dark:text-red-200'
              : 'bg-amber-50/80 text-amber-900 dark:bg-amber-950/15 dark:text-amber-200'
          }`}
        >
          {check.required ? (
            <FiXCircle className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <div className="min-w-0">
            <p className="font-medium">{check.label}</p>
            {check.detail && <p className="mt-0.5 text-xs opacity-80">{check.detail}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}

function ScanRejectedCard({ report }: { report: DekontScanReport }) {
  const strings = useRegistryStrings('components/admin/DekontSharePanel');

  return (
    <div className="rounded-2xl border border-red-200 bg-white p-5 dark:border-red-900/40 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white">{strings.validation.scanRejectedTitle}</h3>
          {report.ocrPreview?.ocrError && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{report.ocrPreview.ocrError}</p>
          )}
        </div>
        <ScorePill score={report.score} ok={report.accepted} />
      </div>
      <CompactValidationIssues checks={report.checks} />
    </div>
  );
}

function DekontShareContent() {
  const strings = useRegistryStrings('components/admin/DekontSharePanel');
  const searchParams = useSearchParams();
  const router = useRouter();
  const draftId = searchParams.get('draft');
  const processParam = searchParams.get('process');
  const errorParam = searchParams.get('error');
  const scanParam = searchParams.get('scan');

  const [draft, setDraft] = useState<DraftPayload | null>(null);
  const [loading, setLoading] = useState(!!draftId);
  const [step, setStep] = useState<Step>(draftId ? 'analyze' : 'upload');
  const [error, setError] = useState<string | null>(errorParam);
  const [scanReport, setScanReport] = useState<DekontScanReport | null>(() => decodeScanReport(scanParam));
  const [success, setSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [paymentDate, setPaymentDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [manualAmount, setManualAmount] = useState('');
  const [transferCodeOverride, setTransferCodeOverride] = useState(false);
  const [ibanSuggestions, setIbanSuggestions] = useState<IbanEmployeeSuggestion[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const processStartedRef = useRef(false);

  useEffect(() => {
    processStartedRef.current = false;
  }, [draftId]);

  useEffect(() => {
    if (errorParam || scanParam) {
      if (errorParam) setError(errorParam);
      if (scanParam) setScanReport(decodeScanReport(scanParam));
      setStep('upload');
      router.replace('/admin-panel/dekont-paylas');
    }
  }, [errorParam, scanParam, router]);

  const applyDraftPayload = useCallback((d: DraftPayload) => {
    setDraft(d);
    setStep('review');
    const suggestions = d.ibanEmployeeSuggestions ?? [];
    setIbanSuggestions(suggestions);
    const top = (d.match_json ?? [])[0];
    if (top) {
      setSelectedRequestId(top.requestId);
      setSelectedProjectId(top.projectId);
      setSelectedEmployeeId('');
    } else if (suggestions.length === 1) {
      setSelectedEmployeeId(suggestions[0]!.employeeId);
      setSelectedProjectId(suggestions[0]!.projectId);
      setSelectedRequestId('');
    } else {
      setSelectedEmployeeId('');
      setSelectedRequestId('');
      setSelectedProjectId('');
    }
    if (d.ocr_json.referenceNo) setReferenceNo(d.ocr_json.referenceNo);
    if (d.ocr_json.paymentDate) setPaymentDate(d.ocr_json.paymentDate);
    if (d.ocr_json.amount != null) setManualAmount(String(d.ocr_json.amount));
    else setManualAmount('');
  }, []);

  const enrichAndApplyDraft = useCallback(
    async (id: string, fallback?: DraftPayload) => {
      const enrichRes = await fetch(`/api/admin/dekont/drafts/${id}`);
      const enrichData = await enrichRes.json();
      if (enrichRes.ok && enrichData.draft) {
        const d = enrichData.draft as DraftPayload;
        d.ibanEmployeeSuggestions = enrichData.ibanEmployeeSuggestions as
          | IbanEmployeeSuggestion[]
          | undefined;
        applyDraftPayload(d);
        return;
      }
      if (fallback) applyDraftPayload(fallback);
    },
    [applyDraftPayload]
  );

  const processDraft = useCallback(
    async (id: string) => {
      setLoading(true);
      setStep('analyze');
      setError(null);
      setScanReport(null);
      try {
        const fileRes = await fetch(`/api/admin/dekont/drafts/${id}/file`);
        if (!fileRes.ok) {
          const errData = (await fileRes.json().catch(() => ({}))) as { error?: string };
          throw new Error(errData.error || strings.errors.draftLoadFailed);
        }
        const blob = await fileRes.blob();
        const mimeType =
          fileRes.headers.get('Content-Type') || blob.type || 'application/octet-stream';
        const { ocrDekontBlob } = await import('@/lib/dekont-ocr-client');
        const rawText = await ocrDekontBlob(blob, mimeType);
        const res = await fetch(`/api/admin/dekont/drafts/${id}/apply-ocr`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rawText, source: 'tesseract' }),
        });
        const data = (await res.json()) as {
          error?: string;
          report?: DekontScanReport | null;
          draft?: DraftPayload;
        };
        if (!res.ok) {
          const serverRes = await fetch(`/api/admin/dekont/drafts/${id}/process`, { method: 'POST' });
          const serverData = (await serverRes.json()) as {
            error?: string;
            report?: DekontScanReport | null;
            draft?: DraftPayload;
          };
          if (serverRes.ok && serverData.draft) {
            await enrichAndApplyDraft(id, serverData.draft);
            router.replace(`/admin-panel/dekont-paylas?draft=${id}`);
            return;
          }
          if (data.report) setScanReport(data.report);
          if (serverData.report) setScanReport(serverData.report);
          throw new Error(serverData.error || data.error || strings.errors.analyzeFailed);
        }
        if (!data.draft) throw new Error(strings.errors.draftLoadFailed);
        await enrichAndApplyDraft(id, data.draft);
        router.replace(`/admin-panel/dekont-paylas?draft=${id}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : strings.errors.analyzeFailed);
        setStep('upload');
        router.replace('/admin-panel/dekont-paylas');
      } finally {
        setLoading(false);
      }
    },
    [enrichAndApplyDraft, router, strings.errors.analyzeFailed, strings.errors.draftLoadFailed]
  );

  const loadDraft = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/dekont/drafts/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || strings.errors.draftLoadFailed);
        const d = data.draft as DraftPayload;
        if (data.ibanEmployeeSuggestions) {
          d.ibanEmployeeSuggestions = data.ibanEmployeeSuggestions as IbanEmployeeSuggestion[];
        }
        if (isDraftPendingOcr(d.ocr_json)) {
          await processDraft(id);
          return;
        }
        applyDraftPayload(d);
      } catch (e) {
        setError(e instanceof Error ? e.message : strings.errors.draftLoadFailed);
        setStep('upload');
      } finally {
        setLoading(false);
      }
    },
    [applyDraftPayload, processDraft, strings.errors.draftLoadFailed]
  );

  useEffect(() => {
    if (!draftId) return;
    if (processParam === '1') {
      if (processStartedRef.current) return;
      processStartedRef.current = true;
      void processDraft(draftId);
      return;
    }
    void loadDraft(draftId);
  }, [draftId, processParam, loadDraft, processDraft]);

  const ocr = draft?.ocr_json;
  const parsedManualAmount = useMemo(() => {
    const raw = manualAmount.trim().replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [manualAmount]);
  const effectiveOcr = useMemo(
    () =>
      ocr
        ? {
            ...ocr,
            amount: parsedManualAmount ?? ocr.amount,
          }
        : null,
    [ocr, parsedManualAmount]
  );
  const validation = useMemo(
    () => (effectiveOcr ? validateDekontDocument(effectiveOcr) : null),
    [effectiveOcr]
  );
  const matches = draft?.match_json ?? [];
  const selectedMatch = matches.find((m) => m.requestId === selectedRequestId) ?? null;
  const confirmReady = useMemo(
    () =>
      effectiveOcr && selectedMatch
        ? validateMatchForConfirm(effectiveOcr, selectedMatch, { transferCodeOverride })
        : { ok: false },
    [effectiveOcr, selectedMatch, transferCodeOverride]
  );
  const selectedIbanEmployee =
    ibanSuggestions.find((e) => e.employeeId === selectedEmployeeId) ?? null;
  const retroactiveReady = useMemo(() => {
    if (!effectiveOcr || !selectedIbanEmployee) return { ok: false as const };
    const amount = parsedManualAmount ?? effectiveOcr.amount;
    if (amount == null || amount <= 0) return { ok: false as const };
    return validateRetroactivePayment(effectiveOcr, amount);
  }, [effectiveOcr, selectedIbanEmployee, parsedManualAmount]);
  const matchChecks = useMemo(
    () =>
      effectiveOcr
        ? buildMatchValidationChecks(effectiveOcr, selectedMatch, { transferCodeOverride })
        : [],
    [effectiveOcr, selectedMatch, transferCodeOverride]
  );

  const processFile = async (file: File) => {
    setUploading(true);
    setError(null);
    setSuccess(null);
    setScanReport(null);
    setStep('analyze');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/admin/dekont/analyze', { method: 'POST', body: form });
      const data = (await res.json().catch(() => ({}))) as {
        draftId?: string;
        error?: string;
        report?: DekontScanReport | null;
      };
      if (!res.ok) {
        if (data.report) setScanReport(data.report);
        throw new Error(data.error || strings.errors.analyzeFailed);
      }
      if (!data.draftId) throw new Error(strings.errors.analyzeFailed);
      router.replace(`/admin-panel/dekont-paylas?draft=${data.draftId}`);
      await loadDraft(data.draftId);
    } catch (e) {
      setError(e instanceof Error ? e.message : strings.errors.analyzeFailed);
      setStep('upload');
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void processFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void processFile(file);
  };

  const resetToUpload = () => {
    setDraft(null);
    setStep('upload');
    setSuccess(null);
    setError(null);
    setScanReport(null);
    setSelectedRequestId('');
    setSelectedProjectId('');
    setTransferCodeOverride(false);
    setIbanSuggestions([]);
    setSelectedEmployeeId('');
    router.replace('/admin-panel/dekont-paylas');
  };

  const handleRetroactiveConfirm = async () => {
    if (!draft || !selectedIbanEmployee || !retroactiveReady.ok) return;
    setConfirming(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/dekont/drafts/${draft.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          retroactive: true,
          employeeId: selectedIbanEmployee.employeeId,
          projectId: selectedIbanEmployee.projectId,
          referenceNo,
          paymentDate,
          amount: parsedManualAmount ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || strings.errors.saveFailed);
      setSuccess(strings.success.paymentSaved);
      setDraft(null);
      setStep('done');
      router.replace('/admin-panel/dekont-paylas');
    } catch (e) {
      setError(e instanceof Error ? e.message : strings.errors.saveFailed);
    } finally {
      setConfirming(false);
    }
  };

  const handleConfirm = async () => {
    if (!draft || !selectedRequestId || !selectedProjectId || !confirmReady.ok) return;
    setConfirming(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/dekont/drafts/${draft.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: selectedRequestId,
          projectId: selectedProjectId,
          referenceNo,
          paymentDate,
          amount: parsedManualAmount ?? undefined,
          transferCodeOverride: transferCodeOverride || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || strings.errors.saveFailed);
      setSuccess(strings.success.paymentSaved);
      setDraft(null);
      setStep('done');
      router.replace('/admin-panel/dekont-paylas');
    } catch (e) {
      setError(e instanceof Error ? e.message : strings.errors.saveFailed);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
          {strings.header.title}
        </h1>
        {strings.header.description ? (
          <p className="mt-1 text-sm text-slate-500">{strings.header.description}</p>
        ) : null}
      </div>

      <StepIndicator step={step} />

      {error && <AlertBanner type="error" message={error} />}
      {scanReport && step === 'upload' && <ScanRejectedCard report={scanReport} />}
      {success && step !== 'done' && <AlertBanner type="success" message={success} />}

      {step === 'upload' && !loading && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`rounded-2xl border-2 border-dashed p-10 text-center transition-colors sm:p-14 ${
            dragOver
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
              : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
          }`}
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
            <FiUpload className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          </div>
          <p className="mt-4 text-base font-semibold text-slate-900 dark:text-white">{strings.upload.title}</p>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-slate-500">{strings.upload.description}</p>
          <label className={`${btnPrimary} mt-6 inline-flex cursor-pointer items-center gap-2`}>
            <FiFileText />
            {strings.upload.selectFile}
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp,image/heic"
              className="hidden"
              disabled={uploading}
              onChange={handleFileUpload}
            />
          </label>
          <p className="mt-3 text-xs text-slate-400">{strings.upload.fileHint}</p>
        </div>
      )}

      {(step === 'analyze' || loading) && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-20 dark:border-slate-800 dark:bg-slate-900">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-900 border-t-transparent dark:border-white" />
          <p className="mt-4 text-sm font-medium text-slate-700 dark:text-slate-200">{strings.analyze.title}</p>
        </div>
      )}

      {step === 'done' && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-10 text-center dark:border-emerald-900/50 dark:bg-emerald-950/20">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
            <FiCheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">{strings.success.doneTitle}</h3>
          <button type="button" className={`${btnPrimary} mt-6`} onClick={resetToUpload}>
            {strings.success.uploadAnother}
          </button>
        </div>
      )}

      {step === 'review' && draft && effectiveOcr && validation && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{draft.proof_file_name}</p>
              {selectedMatch && (
                <p className="truncate text-xs text-slate-500">
                  {selectedMatch.employeeName}
                  {selectedMatch.approvedAt
                    ? ` · ${formatString(strings.review.approvedOn, { date: formatDate(selectedMatch.approvedAt) })}`
                    : ''}
                </p>
              )}
            </div>
            <ScorePill score={validation.score} ok={validation.accepted} />
          </div>

          <CompactValidationIssues checks={validation.checks} />

          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{strings.review.matchTitle}</h3>

            {matches.length === 0 ? (
              <div className="mt-3 space-y-4">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                  <p className="font-medium">{strings.review.noMatchTitle}</p>
                </div>
                {ibanSuggestions.length > 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {strings.review.retroactiveTitle}
                    </h4>
                    <p className="mt-1 text-xs text-slate-500">{strings.review.retroactiveHint}</p>
                    <ul className="mt-3 space-y-2">
                      {ibanSuggestions.map((emp) => (
                        <li key={emp.employeeId}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedEmployeeId(emp.employeeId);
                              setSelectedProjectId(emp.projectId);
                              setSelectedRequestId('');
                            }}
                            className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                              selectedEmployeeId === emp.employeeId
                                ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-950/30'
                                : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900'
                            }`}
                          >
                            <EmployeeAvatar
                              name={emp.employeeName}
                              photoUrl={emp.employeePhotoUrl}
                              size="sm"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium text-slate-900 dark:text-white">
                                {emp.employeeName}
                              </p>
                              <p className="truncate text-xs text-slate-500">
                                {emp.projectName}
                                {emp.ibanMasked ? ` · ${emp.ibanMasked}` : ''}
                              </p>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">{strings.review.retroactiveNoEmployee}</p>
                )}
              </div>
            ) : (
              <ul className="mt-3 space-y-2">
                {matches.map((m) => (
                  <li key={m.requestId}>
                    <PersonnelMatchCard
                      match={m}
                      selected={selectedRequestId === m.requestId}
                      ocr={effectiveOcr}
                      onSelect={() => {
                        setSelectedRequestId(m.requestId);
                        setSelectedProjectId(m.projectId);
                      }}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {matches.length === 0 && ibanSuggestions.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelClass}>{strings.review.ibanLabel}</label>
                  <p className="mt-1 rounded-lg bg-slate-50 px-3 py-2 font-mono text-sm text-slate-800 dark:bg-slate-800/50 dark:text-slate-200">
                    {formatOcrIban(effectiveOcr.recipientIban)}
                  </p>
                </div>
                <div>
                  <label className={labelClass}>{strings.review.amountLabel}</label>
                  <input
                    className={inputClass}
                    inputMode="decimal"
                    placeholder="0,00"
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>{strings.review.paymentDateLabel}</label>
                  <input
                    type="date"
                    className={inputClass}
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>{strings.review.referenceLabel}</label>
                  <input className={inputClass} value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} />
                </div>
              </div>
              {!retroactiveReady.ok && retroactiveReady.reason && (
                <p className="mt-4 flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
                  <FiAlertTriangle className="mt-0.5 shrink-0" />
                  {retroactiveReady.reason}
                </p>
              )}
              <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-5 dark:border-slate-800">
                <button
                  type="button"
                  className={btnPrimary}
                  disabled={confirming || !retroactiveReady.ok}
                  onClick={() => void handleRetroactiveConfirm()}
                >
                  {confirming ? strings.review.saveSaving : strings.review.retroactiveSave}
                </button>
                <label className={`${btnSecondary} inline-flex cursor-pointer items-center gap-1.5`}>
                  <FiRefreshCw className="h-4 w-4" />
                  {strings.review.anotherDekont}
                  <input type="file" accept="application/pdf,image/*" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
            </div>
          )}

          {matches.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
              {!confirmReady.ok && <CompactValidationIssues checks={matchChecks} />}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelClass}>{strings.review.ibanLabel}</label>
                  <p className="mt-1 rounded-lg bg-slate-50 px-3 py-2 font-mono text-sm text-slate-800 dark:bg-slate-800/50 dark:text-slate-200">
                    {formatOcrIban(effectiveOcr.recipientIban)}
                  </p>
                </div>
                {selectedMatch?.expectedTransferToken && (
                  <div className="sm:col-span-2">
                    <label className={labelClass}>{strings.review.transferCodeLabel}</label>
                    <p className="mt-1 rounded-lg bg-slate-50 px-3 py-2 font-mono text-sm text-slate-800 dark:bg-slate-800/50 dark:text-slate-200">
                      {selectedMatch.expectedTransferToken}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{strings.review.transferCodeHint}</p>
                    {!selectedMatch.transferTokenMatched && (
                      <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={transferCodeOverride}
                          onChange={(e) => setTransferCodeOverride(e.target.checked)}
                        />
                        <span>{strings.review.transferCodeOverride}</span>
                      </label>
                    )}
                  </div>
                )}
                <div>
                  <label className={labelClass}>{strings.review.amountLabel}</label>
                  <input
                    className={inputClass}
                    inputMode="decimal"
                    placeholder="0,00"
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                  />
                  {!ocr?.amount && (
                    <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">{strings.review.amountHint}</p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>{strings.review.paymentDateLabel}</label>
                  <input
                    type="date"
                    className={inputClass}
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>{strings.review.referenceLabel}</label>
                  <input className={inputClass} value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} />
                </div>
              </div>

              {!confirmReady.ok && confirmReady.reason && (
                <p className="mt-4 flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
                  <FiAlertTriangle className="mt-0.5 shrink-0" />
                  {confirmReady.reason}
                </p>
              )}

              <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-5 dark:border-slate-800">
                <button
                  type="button"
                  className={btnPrimary}
                  disabled={confirming || !confirmReady.ok}
                  onClick={() => void handleConfirm()}
                >
                  {confirming ? strings.review.saveSaving : strings.review.savePayment}
                </button>
                {selectedProjectId && selectedMatch && (
                  <Link
                    href={`/admin-panel/proje/${selectedProjectId}/list/${selectedMatch.employeeId}`}
                    className={`${btnSecondary} inline-flex items-center gap-1.5`}
                  >
                    <FiUser className="h-4 w-4" />
                    {strings.review.viewProfile}
                  </Link>
                )}
                <label className={`${btnSecondary} inline-flex cursor-pointer items-center gap-1.5`}>
                  <FiRefreshCw className="h-4 w-4" />
                  {strings.review.anotherDekont}
                  <input type="file" accept="application/pdf,image/*" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function DekontSharePanel() {
  const strings = useRegistryStrings('components/admin/DekontSharePanel');
  return (
    <DekontScanShell>
      <Suspense
        fallback={
          <div className="flex flex-col items-center py-20">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-900 border-t-transparent dark:border-white" />
            <p className="mt-3 text-sm text-slate-500">{strings.loading}</p>
          </div>
        }
      >
        <DekontShareContent />
      </Suspense>
    </DekontScanShell>
  );
}
