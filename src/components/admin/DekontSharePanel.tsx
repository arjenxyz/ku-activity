'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dayjs from 'dayjs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiAlertTriangle,
  FiCheck,
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
  FiFileText,
  FiRefreshCw,
  FiShare2,
  FiShield,
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
  MIN_TRUST_SCORE,
  buildMatchValidationChecks,
  splitValidationChecks,
  validateDekontDocument,
  validateMatchForConfirm,
  type DekontValidationCheck,
  type DekontValidationResult,
} from '@/lib/dekont-validation';
import { formatString } from '@/lib/strings/format';
import strings from '@json/src/components/admin/DekontSharePanel.json';

type DraftPayload = {
  id: string;
  ocr_json: DekontOcrResult;
  match_json: DekontMatchSuggestion[];
  proof_file_name: string;
};

type Step = 'upload' | 'analyze' | 'review' | 'done';

const STEPS: { id: Step; label: string }[] = [
  { id: 'upload', label: strings.steps.upload },
  { id: 'analyze', label: strings.steps.analyze },
  { id: 'review', label: strings.steps.review },
];

function TrustRing({ score, accepted }: { score: number; accepted: boolean }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = accepted ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative mx-auto h-28 w-28">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="6" className="text-slate-200 dark:text-slate-700" />
        <motion.circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{score}</span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{strings.trustLabel}</span>
      </div>
    </div>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const idx = step === 'upload' ? 0 : step === 'analyze' ? 1 : step === 'review' ? 2 : 3;
  return (
    <ol className="flex flex-wrap items-center gap-2 text-xs font-medium">
      {STEPS.map((s, i) => {
        const active = i === idx;
        const done = i < idx || step === 'done';
        return (
          <li key={s.id} className="flex items-center gap-2">
            {i > 0 && <span className="text-slate-300 dark:text-slate-600">→</span>}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors ${
                done
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                  : active
                    ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 ring-2 ring-indigo-400/30'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {done ? <FiCheck className="h-3 w-3" /> : <span className="w-3 text-center">{i + 1}</span>}
              {s.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function CheckRow({ check, compact }: { check: DekontValidationCheck; compact?: boolean }) {
  return (
    <li
      className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 text-sm ${
        check.passed
          ? 'border-emerald-200/80 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/20'
          : check.required
            ? 'border-red-200/80 bg-red-50/60 dark:border-red-900/50 dark:bg-red-950/20'
            : 'border-amber-200/60 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/15'
      }`}
    >
      {check.passed ? (
        <FiCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
      ) : check.required ? (
        <FiXCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
      ) : (
        <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
      )}
      <div className="min-w-0 flex-1">
        <p className="font-medium text-slate-800 dark:text-slate-100">
          {check.label}
          {!check.required && (
            <span className="ml-1.5 text-[10px] font-normal uppercase text-slate-400">{strings.optionalBadge}</span>
          )}
        </p>
        {check.detail && (
          <p className={`mt-0.5 text-xs text-slate-500 dark:text-slate-400 ${compact ? 'line-clamp-2' : ''}`}>
            {check.detail}
          </p>
        )}
      </div>
    </li>
  );
}

function ValidationDetailsPanel({
  title,
  checks,
  defaultExpanded = false,
}: {
  title: string;
  checks: DekontValidationCheck[];
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const { passed, failedRequired, failedOptional } = splitValidationChecks(checks);
  const failed = [...failedRequired, ...failedOptional];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
          <FiCheck className="h-3 w-3" />
          {formatString(strings.validation.matchedCount, { count: passed.length })}
        </span>
        {failedRequired.length > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800 dark:bg-red-950/50 dark:text-red-300">
            <FiXCircle className="h-3 w-3" />
            {formatString(strings.validation.requiredIssuesCount, { count: failedRequired.length })}
          </span>
        )}
        {failedOptional.length > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            <FiAlertTriangle className="h-3 w-3" />
            {formatString(strings.validation.optionalMissingCount, { count: failedOptional.length })}
          </span>
        )}
      </div>

      {!expanded && failedRequired.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-400">
            {strings.validation.fixRequiredTitle}
          </p>
          <ul className="space-y-2">
            {failedRequired.map((check) => (
              <CheckRow key={check.id} check={check} compact />
            ))}
          </ul>
        </div>
      )}

      {!expanded && failedRequired.length === 0 && passed.length > 0 && (
        <ul className="space-y-2">
          {passed.slice(0, 2).map((check) => (
            <CheckRow key={check.id} check={check} compact />
          ))}
          {passed.length > 2 && (
            <p className="text-xs text-slate-500">{formatString(strings.validation.moreMatchedChecks, { count: passed.length - 2 })}</p>
          )}
        </ul>
      )}

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        {expanded ? (
          <>
            <FiChevronUp className="h-4 w-4" />
            {strings.validation.hideDetails}
          </>
        ) : (
          <>
            <FiChevronDown className="h-4 w-4" />
            {strings.validation.showDetails}
          </>
        )}
      </button>

      {expanded && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
              <FiCheckCircle className="h-3.5 w-3.5" />
              {formatString(strings.validation.matchedSection, { count: passed.length })}
            </p>
            {passed.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-xs text-slate-500 dark:border-slate-700">
                {strings.validation.noPassedChecks}
              </p>
            ) : (
              <ul className="space-y-2">
                {passed.map((check) => (
                  <CheckRow key={check.id} check={check} />
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-400">
              <FiXCircle className="h-3.5 w-3.5" />
              {formatString(strings.validation.failedSection, { count: failed.length })}
            </p>
            {failed.length === 0 ? (
              <p className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/50 px-3 py-4 text-xs text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300">
                {strings.validation.allPassed}
              </p>
            ) : (
              <ul className="space-y-2">
                {failed.map((check) => (
                  <CheckRow key={check.id} check={check} />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {!expanded && (
        <p className="text-[11px] text-slate-400">{formatString(strings.validation.expandHint, { title })}</p>
      )}
    </div>
  );
}

function ValidationChecklist({ validation }: { validation: DekontValidationResult }) {
  return <ValidationDetailsPanel title={strings.validation.documentTitle} checks={validation.checks} />;
}

function DekontShareContent() {
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

  const loadDraft = useCallback(async (id: string) => {
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
  }, []);

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
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void processFile(file);
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

  return (
    <div className="space-y-6">
      <ProjectPageHeader
        title={strings.header.title}
        description={strings.header.description}
      />

      <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
        <StepIndicator step={step} />
      </div>

      {error && <AlertBanner type="error" message={error} />}
      {success && <AlertBanner type="success" message={success} />}

      <AnimatePresence mode="wait">
        {step === 'upload' && !loading && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="grid gap-6 lg:grid-cols-5"
          >
            <div className="lg:col-span-3 space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`relative overflow-hidden rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
                  dragOver
                    ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/30'
                    : 'border-slate-300 bg-gradient-to-br from-slate-50 to-white dark:border-slate-700 dark:from-slate-900 dark:to-slate-950'
                }`}
              >
                <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-indigo-500/5" />
                <FiUpload className="mx-auto h-10 w-10 text-indigo-500" />
                <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">{strings.upload.title}</h3>
                <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                  {strings.upload.description}
                </p>
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
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50 to-indigo-50/50 p-5 dark:border-blue-900/40 dark:from-blue-950/30 dark:to-indigo-950/20">
                <div className="flex items-start gap-3">
                  <FiShare2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="font-semibold text-blue-900 dark:text-blue-100">{strings.shareFromBank.title}</p>
                    <p className="mt-1 text-sm text-blue-800/90 dark:text-blue-200/80">
                      {strings.shareFromBank.descriptionPrefix}
                      <strong>{strings.shareFromBank.appName}</strong>
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-900/50">
                <div className="flex items-start gap-3">
                  <FiShield className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{strings.security.title}</p>
                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <li>{strings.security.ibanRequired}</li>
                      <li>{strings.security.keywords}</li>
                      <li>{strings.security.matchRequired}</li>
                      <li>
                        {formatString(strings.security.minScores, {
                          minTrust: MIN_TRUST_SCORE,
                          minMatch: MIN_MATCH_SCORE,
                        })}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {(step === 'analyze' || loading) && (
          <motion.div
            key="analyze"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-20 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="h-12 w-12 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            <p className="mt-4 font-medium text-slate-700 dark:text-slate-200">{strings.analyze.title}</p>
            <p className="mt-1 text-sm text-slate-500">{strings.analyze.subtitle}</p>
          </motion.div>
        )}

        {step === 'review' && draft && ocr && validation && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-6 xl:grid-cols-12"
          >
            <div className="xl:col-span-5 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{strings.review.documentValidation}</h3>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{draft.proof_file_name}</p>
                  </div>
                  <TrustRing score={validation.score} accepted={validation.accepted} />
                </div>
                <p
                  className={`mt-4 rounded-xl px-3 py-2 text-sm font-medium ${
                    validation.accepted
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
                      : 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200'
                  }`}
                >
                  {validation.summary}
                </p>
                <div className="mt-4">
                  <ValidationChecklist validation={validation} />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="font-semibold text-slate-900 dark:text-white">{strings.review.ocrDataTitle}</h3>
                <p className="mt-0.5 text-xs text-slate-500">{strings.review.ocrDataSubtitle}</p>
                <dl className="mt-4 grid gap-3 text-sm">
                  {[
                    [strings.ocrFields.senderBank, ocr.senderBank ?? strings.ocrFields.empty],
                    [strings.ocrFields.recipientBank, ocr.recipientBank ?? strings.ocrFields.empty],
                    [strings.ocrFields.transferType, transferTypeLabel(ocr.transferType)],
                    [strings.ocrFields.recipientIban, formatOcrIban(ocr.recipientIban)],
                    [strings.ocrFields.amount, ocr.amount != null ? formatMoney(ocr.amount) : strings.ocrFields.empty],
                    [strings.ocrFields.reference, ocr.referenceNo ?? strings.ocrFields.empty],
                    [strings.ocrFields.date, ocr.paymentDate ?? strings.ocrFields.empty],
                    [
                      strings.ocrFields.source,
                      ocr.source === 'pdf'
                        ? strings.ocrFields.sourcePdf
                        : ocr.source === 'vision'
                          ? strings.ocrFields.sourceVision
                          : strings.ocrFields.empty,
                    ],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4 border-b border-slate-100 pb-2 dark:border-slate-800">
                      <dt className="text-slate-500">{label}</dt>
                      <dd className="text-right font-medium tabular-nums text-slate-900 dark:text-white">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            <div className="xl:col-span-7 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="font-semibold text-slate-900 dark:text-white">{strings.review.matchTitle}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {formatString(strings.review.matchSubtitle, { minMatch: MIN_MATCH_SCORE })}
                </p>

                {matches.length === 0 ? (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                    <p className="font-medium">{strings.review.noMatchTitle}</p>
                    <p className="mt-1 opacity-90">{strings.review.noMatchDescription}</p>
                    <Link href="/admin-panel" className={`${btnSecondary} mt-3 inline-flex`}>
                      {strings.review.goToProjects}
                    </Link>
                  </div>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {matches.map((m) => {
                      const selected = selectedRequestId === m.requestId;
                      const matchOk = validateMatchForConfirm(ocr, m).ok;
                      return (
                        <li key={m.requestId}>
                          <label
                            className={`block cursor-pointer rounded-xl border p-4 transition-all ${
                              selected
                                ? 'border-indigo-500 bg-indigo-50/80 ring-2 ring-indigo-400/20 dark:bg-indigo-950/30'
                                : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'
                            } ${!matchOk ? 'opacity-75' : ''}`}
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
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-white">{m.employeeName}</p>
                                <p className="text-sm text-slate-500">
                                  {m.projectName} · {formatMoney(m.approvedAmount)}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {m.reasons.map((r) => (
                                    <span
                                      key={r}
                                      className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                    >
                                      {r}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="text-right">
                                <span
                                  className={`inline-flex rounded-lg px-2 py-1 text-xs font-bold tabular-nums ${
                                    m.score >= MIN_MATCH_SCORE
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                                      : 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300'
                                  }`}
                                >
                                  {m.score}
                                </span>
                              </div>
                            </div>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {matches.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <ValidationDetailsPanel
                      title={strings.validation.confirmTitle}
                      checks={matchChecks}
                      defaultExpanded={!confirmReady.ok}
                    />

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
                  </div>
                )}

                {!confirmReady.ok && (
                  <p className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200">
                    <FiAlertTriangle className="mt-0.5 shrink-0" />
                    {confirmReady.reason ?? strings.review.confirmNotReady}
                  </p>
                )}

                <div className="mt-6 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={btnPrimary}
                    disabled={confirming || !confirmReady.ok}
                    onClick={() => void handleConfirm()}
                  >
                    <FiCheck className="mr-1 inline" />
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
                    <input
                      type="file"
                      accept="application/pdf,image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DekontSharePanel() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <p className="mt-3 text-sm text-slate-500">{strings.loading}</p>
        </div>
      }
    >
      <DekontShareContent />
    </Suspense>
  );
}
