'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dayjs from 'dayjs';
import {
  FiAlertTriangle,
  FiCheck,
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
  FiFileText,
  FiRefreshCw,
  FiUpload,
  FiXCircle,
} from 'react-icons/fi';
import { AlertBanner } from '@/components/project/AlertBanner';
import { ProjectPageHeader } from '@/components/project/ProjectPageHeader';
import { btnPrimary, btnSecondary, labelClass, inputClass } from '@/components/project/ui';
import { formatMoney } from '@/lib/format';
import { formatOcrIban } from '@/lib/advance-dekont-match';
import type { DekontMatchSuggestion } from '@/lib/advance-dekont-match';
import type { DekontOcrResult } from '@/lib/dekont-ocr';
import { transferTypeLabel } from '@/lib/turkish-banks';
import {
  MIN_MATCH_SCORE,
  buildMatchValidationChecks,
  splitValidationChecks,
  validateDekontDocument,
  validateMatchForConfirm,
  type DekontValidationCheck,
} from '@/lib/dekont-validation';

type DraftPayload = {
  id: string;
  ocr_json: DekontOcrResult;
  match_json: DekontMatchSuggestion[];
  proof_file_name: string;
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
    <div className="flex items-center gap-2">
      {steps.map((s, i) => {
        const active = i === idx;
        const done = i < idx || step === 'done';
        return (
          <div key={s.id} className="flex items-center gap-2 flex-1 min-w-0">
            {i > 0 && (
              <div
                className={`h-0.5 w-4 sm:w-8 shrink-0 rounded-full ${
                  done ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            )}
            <div
              className={`flex items-center gap-2 min-w-0 rounded-xl px-3 py-2 text-xs font-medium flex-1 ${
                done
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300'
                  : active
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black/10 text-[10px] font-bold">
                {done ? <FiCheck className="h-3 w-3" /> : i + 1}
              </span>
              <span className="truncate">{s.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ScoreBadge({ score, accepted }: { score: number; accepted: boolean }) {
  const strings = useRegistryStrings('components/admin/DekontSharePanel');
  return (
    <div
      className={`shrink-0 rounded-xl px-3 py-2 text-center ${
        accepted
          ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
          : score >= 40
            ? 'bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200'
            : 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200'
      }`}
    >
      <p className="text-xl font-bold tabular-nums leading-none">{score}</p>
      <p className="mt-1 text-[10px] font-medium uppercase tracking-wide opacity-80">{strings.trustLabel}</p>
    </div>
  );
}

function CheckRow({ check }: { check: DekontValidationCheck }) {
  const strings = useRegistryStrings('components/admin/DekontSharePanel');

  return (
    <li
      className={`flex items-start gap-2.5 rounded-lg px-3 py-2 text-sm ${
        check.passed
          ? 'bg-emerald-50/80 text-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-200'
          : check.required
            ? 'bg-red-50/80 text-red-900 dark:bg-red-950/20 dark:text-red-200'
            : 'bg-amber-50/60 text-amber-900 dark:bg-amber-950/15 dark:text-amber-200'
      }`}
    >
      {check.passed ? (
        <FiCheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
      ) : check.required ? (
        <FiXCircle className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <div className="min-w-0">
        <p className="font-medium">
          {check.label}
          {!check.required && (
            <span className="ml-1.5 text-[10px] font-normal opacity-60">{strings.optionalBadge}</span>
          )}
        </p>
        {check.detail && <p className="mt-0.5 text-xs opacity-75">{check.detail}</p>}
      </div>
    </li>
  );
}

function ValidationSummary({ checks }: { checks: DekontValidationCheck[] }) {
  const strings = useRegistryStrings('components/admin/DekontSharePanel');
  const [expanded, setExpanded] = useState(false);
  const { passed, failedRequired, failedOptional } = splitValidationChecks(checks);
  const issues = [...failedRequired, ...failedOptional];

  if (!issues.length) {
    return (
      <p className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
        <FiCheckCircle className="h-4 w-4 shrink-0" />
        {strings.validation.allPassed}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <ul className="space-y-1.5">
        {issues.map((check) => (
          <CheckRow key={check.id} check={check} />
        ))}
      </ul>
      {passed.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            {expanded ? <FiChevronUp className="h-3.5 w-3.5" /> : <FiChevronDown className="h-3.5 w-3.5" />}
            {expanded ? strings.validation.hideAll : strings.validation.showAll}
          </button>
          {expanded && (
            <ul className="space-y-1.5">
              {passed.map((check) => (
                <CheckRow key={check.id} check={check} />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function DekontShareContent() {
  const strings = useRegistryStrings('components/admin/DekontSharePanel');
  const searchParams = useSearchParams();
  const router = useRouter();
  const draftId = searchParams.get('draft');
  const errorParam = searchParams.get('error');

  const [draft, setDraft] = useState<DraftPayload | null>(null);
  const [loading, setLoading] = useState(!!draftId);
  const [step, setStep] = useState<Step>(draftId ? 'analyze' : 'upload');
  const [error, setError] = useState<string | null>(errorParam);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [paymentDate, setPaymentDate] = useState(dayjs().format('YYYY-MM-DD'));

  const loadDraft = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/dekont/drafts/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || strings.errors.draftLoadFailed);
        const d = data.draft as DraftPayload;
        setDraft(d);
        setStep('review');
        const top = (d.match_json ?? [])[0];
        if (top) {
          setSelectedRequestId(top.requestId);
          setSelectedProjectId(top.projectId);
        }
        if (d.ocr_json.referenceNo) setReferenceNo(d.ocr_json.referenceNo);
        if (d.ocr_json.paymentDate) setPaymentDate(d.ocr_json.paymentDate);
      } catch (e) {
        setError(e instanceof Error ? e.message : strings.errors.draftLoadFailed);
        setStep('upload');
      } finally {
        setLoading(false);
      }
    },
    [strings.errors.draftLoadFailed]
  );

  useEffect(() => {
    if (draftId) void loadDraft(draftId);
  }, [draftId, loadDraft]);

  const ocr = draft?.ocr_json;
  const validation = useMemo(() => (ocr ? validateDekontDocument(ocr) : null), [ocr]);
  const matches = draft?.match_json ?? [];
  const selectedMatch = matches.find((m) => m.requestId === selectedRequestId) ?? null;
  const confirmReady = useMemo(
    () => (ocr && selectedMatch ? validateMatchForConfirm(ocr, selectedMatch) : { ok: false }),
    [ocr, selectedMatch]
  );
  const matchChecks = useMemo(
    () => (ocr ? buildMatchValidationChecks(ocr, selectedMatch) : []),
    [ocr, selectedMatch]
  );

  const processFile = async (file: File) => {
    setUploading(true);
    setError(null);
    setSuccess(null);
    setStep('analyze');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/admin/dekont/analyze', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || strings.errors.analyzeFailed);
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
    setSelectedRequestId('');
    setSelectedProjectId('');
    router.replace('/admin-panel/dekont-paylas');
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

  const ocrRows = ocr
    ? [
        [strings.ocrFields.amount, ocr.amount != null ? formatMoney(ocr.amount) : strings.ocrFields.empty],
        [strings.ocrFields.recipientIban, formatOcrIban(ocr.recipientIban)],
        [strings.ocrFields.senderBank, ocr.senderBank ?? strings.ocrFields.empty],
        [strings.ocrFields.recipientBank, ocr.recipientBank ?? strings.ocrFields.empty],
        [strings.ocrFields.transferType, transferTypeLabel(ocr.transferType)],
        [strings.ocrFields.reference, ocr.referenceNo ?? strings.ocrFields.empty],
        [strings.ocrFields.date, ocr.paymentDate ?? strings.ocrFields.empty],
      ]
    : [];

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <ProjectPageHeader title={strings.header.title} description={strings.header.description} />

      <StepIndicator step={step} />

      {error && <AlertBanner type="error" message={error} />}
      {success && step !== 'done' && <AlertBanner type="success" message={success} />}

      {step === 'upload' && !loading && (
        <div className="space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-colors ${
              dragOver
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
            }`}
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
              <FiUpload className="h-6 w-6 text-slate-600 dark:text-slate-300" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">{strings.upload.title}</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{strings.upload.description}</p>
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
          <p className="text-center text-xs text-slate-500">{strings.upload.shareTip}</p>
        </div>
      )}

      {(step === 'analyze' || loading) && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 dark:border-slate-800 dark:bg-slate-900">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-900 border-t-transparent dark:border-white" />
          <p className="mt-4 text-sm font-medium text-slate-700 dark:text-slate-200">{strings.analyze.title}</p>
        </div>
      )}

      {step === 'done' && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center dark:border-emerald-900/50 dark:bg-emerald-950/20">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
            <FiCheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">{strings.success.doneTitle}</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{strings.success.doneDescription}</p>
          <button type="button" className={`${btnPrimary} mt-6`} onClick={resetToUpload}>
            {strings.success.uploadAnother}
          </button>
        </div>
      )}

      {step === 'review' && draft && ocr && validation && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-900 dark:text-white">{strings.review.documentValidation}</h3>
                <p className="mt-0.5 truncate text-xs text-slate-500">{draft.proof_file_name}</p>
                <p
                  className={`mt-3 text-sm ${
                    validation.accepted ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'
                  }`}
                >
                  {validation.summary}
                </p>
              </div>
              <ScoreBadge score={validation.score} accepted={validation.accepted} />
            </div>
            <div className="mt-4">
              <ValidationSummary checks={validation.checks} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-semibold text-slate-900 dark:text-white">{strings.review.ocrDataTitle}</h3>
            <dl className="mt-4 grid gap-2 sm:grid-cols-2 text-sm">
              {ocrRows.map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/50"
                >
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="text-right font-medium tabular-nums text-slate-900 dark:text-white">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-semibold text-slate-900 dark:text-white">{strings.review.matchTitle}</h3>

            {matches.length === 0 ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                <p className="font-medium">{strings.review.noMatchTitle}</p>
                <p className="mt-1 opacity-90">{strings.review.noMatchDescription}</p>
                <Link href="/admin-panel" className={`${btnSecondary} mt-3 inline-flex`}>
                  {strings.review.goToProjects}
                </Link>
              </div>
            ) : (
              <ul className="mt-4 space-y-2">
                {matches.map((m) => {
                  const selected = selectedRequestId === m.requestId;
                  const matchOk = validateMatchForConfirm(ocr, m).ok;
                  return (
                    <li key={m.requestId}>
                      <label
                        className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-colors ${
                          selected
                            ? 'border-slate-900 bg-slate-50 dark:border-white dark:bg-slate-800'
                            : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                        } ${!matchOk ? 'opacity-70' : ''}`}
                      >
                        <input
                          type="radio"
                          name="match"
                          className="sr-only"
                          checked={selected}
                          onChange={() => {
                            setSelectedRequestId(m.requestId);
                            setSelectedProjectId(m.projectId);
                          }}
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-white">{m.employeeName}</p>
                          <p className="text-sm text-slate-500">
                            {m.projectName} · {formatMoney(m.approvedAmount)}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-lg px-2 py-1 text-xs font-bold tabular-nums ${
                            m.score >= MIN_MATCH_SCORE
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                              : 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300'
                          }`}
                        >
                          {m.score}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}

            {matches.length > 0 && (
              <div className="mt-5 space-y-4 border-t border-slate-100 pt-5 dark:border-slate-800">
                {!confirmReady.ok && (
                  <ValidationSummary checks={matchChecks} />
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>{strings.review.referenceLabel}</label>
                    <input className={inputClass} value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} />
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
                </div>

                {!confirmReady.ok && confirmReady.reason && (
                  <p className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
                    <FiAlertTriangle className="mt-0.5 shrink-0" />
                    {confirmReady.reason}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={btnPrimary}
                    disabled={confirming || !confirmReady.ok}
                    onClick={() => void handleConfirm()}
                  >
                    {confirming ? strings.review.saveSaving : strings.review.savePayment}
                  </button>
                  {selectedProjectId && (
                    <Link
                      href={`/admin-panel/proje/${selectedProjectId}/avans-talepleri`}
                      className={btnSecondary}
                    >
                      {strings.review.advanceRequests}
                    </Link>
                  )}
                  <label className={`${btnSecondary} inline-flex cursor-pointer items-center gap-1`}>
                    <FiRefreshCw className="h-4 w-4" />
                    {strings.review.anotherDekont}
                    <input type="file" accept="application/pdf,image/*" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function DekontSharePanel() {
  const strings = useRegistryStrings('components/admin/DekontSharePanel');
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-900 border-t-transparent dark:border-white" />
          <p className="mt-3 text-sm text-slate-500">{strings.loading}</p>
        </div>
      }
    >
      <DekontShareContent />
    </Suspense>
  );
}
