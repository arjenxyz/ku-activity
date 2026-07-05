'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { FiCheck, FiDownload, FiShield } from 'react-icons/fi';
import { PERSONNEL_SELF_EXPORT_DAILY_LIMIT } from '@/lib/legal-dossier/types';
import { formatString } from '@/lib/strings/format';
import { ClosureCountdown } from '@/components/closure/ClosureCountdown';
import type { PersonnelClosureStatus } from '@/lib/project-closure-dossier';

type DossierSection = { id: string; title: string };

function parseFilename(contentDisposition: string | null, fallback: string) {
  if (!contentDisposition) return fallback;
  const match = /filename="([^"]+)"/i.exec(contentDisposition);
  return match?.[1] ?? fallback;
}

type Props = {
  variant?: 'card' | 'closure';
  showDailyLimit?: boolean;
  showCountdown?: boolean;
  embedded?: boolean;
};

export function PersonnelClosureDossierPanel({
  variant = 'card',
  showDailyLimit = true,
  showCountdown = true,
  embedded = false,
}: Props) {
  const strings = useRegistryStrings('components/personnel/PersonnelClosureDossierPanel');
  const [sections, setSections] = useState<DossierSection[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [closureStatus, setClosureStatus] = useState<PersonnelClosureStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [consentLoading, setConsentLoading] = useState(false);
  const [ackLoading, setAckLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadedThisSession, setDownloadedThisSession] = useState(false);

  const loadClosureStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/personnel/closure/status');
      if (!res.ok) return;
      const data = (await res.json()) as PersonnelClosureStatus;
      setClosureStatus(data);
    } catch {
      setClosureStatus(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [sectionsRes] = await Promise.all([
          fetch('/api/personnel/my-dossier/sections'),
          loadClosureStatus(),
        ]);
        if (sectionsRes.ok && !cancelled) {
          const data = (await sectionsRes.json()) as { sections?: DossierSection[] };
          setSections(data.sections ?? []);
        }
      } catch {
        if (!cancelled) setSections([]);
      } finally {
        if (!cancelled) setSectionsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadClosureStatus]);

  const inClosure = closureStatus?.inClosure ?? false;
  const hasConsent = Boolean(closureStatus?.consent?.consentedAt);
  const hasAcknowledged = Boolean(closureStatus?.consent?.dataExportAcknowledgedAt);
  const effectiveVariant = variant === 'closure' || inClosure ? 'closure' : 'card';
  const canDownload = !inClosure || hasConsent;

  const handleConsent = async () => {
    setConsentLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/personnel/closure/consent', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || strings.errors.consentFailed);
      }
      await loadClosureStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.errors.generic);
    } finally {
      setConsentLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!canDownload) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/personnel/my-dossier');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || strings.errors.downloadFailed);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = parseFilename(
        res.headers.get('Content-Disposition'),
        strings.fallbackFilename
      );
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setDownloadedThisSession(true);
      await loadClosureStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.errors.generic);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async () => {
    setAckLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/personnel/closure/acknowledge-export', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || strings.errors.ackFailed);
      }
      await loadClosureStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.errors.generic);
    } finally {
      setAckLoading(false);
    }
  };

  const showAckButton =
    inClosure &&
    hasConsent &&
    !hasAcknowledged &&
    (downloadedThisSession || Boolean(closureStatus?.consent?.dataExportedAt));

  const ackButton = showAckButton ? (
    <button
      type="button"
      onClick={() => void handleAcknowledge()}
      disabled={ackLoading}
      className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border-2 border-emerald-500/80 text-emerald-700 dark:text-emerald-400 text-sm font-semibold disabled:opacity-50 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors"
    >
      {ackLoading ? strings.preparing : strings.ackCta}
    </button>
  ) : null;

  const consentBlock =
    inClosure && !hasConsent ? (
      <div className="space-y-4">
        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400 max-h-28 overflow-y-auto">
          {strings.consentText}
        </p>
        <button
          type="button"
          onClick={() => void handleConsent()}
          disabled={consentLoading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-600 px-5 py-3.5 text-sm font-semibold text-white shadow-md shadow-amber-600/20 transition-colors hover:bg-amber-700 disabled:opacity-50"
        >
          {consentLoading ? strings.preparing : strings.consentCta}
        </button>
      </div>
    ) : null;

  const checklist = embedded ? (
    <div className="mb-4">
      {sectionsLoading ? (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-transparent" />
          {strings.checklistLoading}
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
          {sections.map((section) => (
            <span
              key={section.id}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            >
              <FiCheck className="h-3 w-3 shrink-0 text-emerald-600" aria-hidden />
              {section.title}
            </span>
          ))}
        </div>
      )}
    </div>
  ) : (
    <div className="mt-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {strings.checklistTitle}
      </p>
      {sectionsLoading ? (
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
          <span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
          {strings.checklistLoading}
        </div>
      ) : (
        <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 max-h-52 overflow-y-auto">
          {sections.map((section) => (
            <li
              key={section.id}
              className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300"
            >
              <span className="shrink-0 mt-0.5 w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
                <FiCheck className="w-2.5 h-2.5" strokeWidth={3} aria-hidden />
              </span>
              <span className="leading-snug">{section.title}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const deadlineNote =
    inClosure && closureStatus?.deadlineAt && showCountdown ? (
      <div className="mt-5">
        <ClosureCountdown
          deadlineAt={closureStatus.deadlineAt}
          phase={closureStatus.phase}
          size="md"
          variant="premium"
        />
      </div>
    ) : null;

  const downloadButton = (
    <button
      type="button"
      onClick={() => void handleDownload()}
      disabled={loading || !canDownload}
      className={
        effectiveVariant === 'closure'
          ? 'w-full inline-flex items-center justify-center gap-2.5 rounded-2xl bg-[#0E1548] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#0E1548]/20 transition-colors hover:bg-[#152060] disabled:opacity-50 active:scale-[0.99]'
          : 'mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50'
      }
    >
      {loading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          {strings.preparing}
        </>
      ) : (
        <>
          <FiDownload className="h-4 w-4" strokeWidth={2.5} />
          {embedded ? strings.closureDownloadCta : strings.downloadCta}
        </>
      )}
    </button>
  );

  const closureBody = (
    <>
      {deadlineNote}
      {consentBlock}
      {hasConsent ? checklist : null}
      {showDailyLimit && hasConsent && !embedded && (
        <p className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500">
          {formatString(strings.dailyLimit, { limit: PERSONNEL_SELF_EXPORT_DAILY_LIMIT })}
        </p>
      )}
      {hasConsent ? (
        <div className={embedded ? 'mt-auto space-y-2.5 pt-4' : 'mt-4 space-y-2.5'}>
          {downloadButton}
          {ackButton}
        </div>
      ) : null}
      {hasAcknowledged ? (
        <div className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-emerald-200/60 bg-emerald-50 px-3 py-2.5 dark:border-emerald-800/40 dark:bg-emerald-950/30">
          <FiCheck className="h-4 w-4 text-emerald-600" />
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">{strings.ackDone}</p>
        </div>
      ) : null}
      {error && (
        <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-center text-xs text-red-600 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </p>
      )}
    </>
  );

  if (effectiveVariant === 'closure' && embedded) {
    return <div className="flex min-h-0 flex-1 flex-col">{closureBody}</div>;
  }

  if (effectiveVariant === 'closure') {
    return (
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_40px_rgba(14,21,72,0.08)] dark:border-slate-700/80 dark:bg-slate-900 sm:p-6">
        {closureBody}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-gradient-to-br from-blue-50/90 to-white dark:from-slate-800 dark:to-slate-900 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
          <FiShield className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{strings.title}</p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
            {strings.description}
          </p>
          <div className="mt-3">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{strings.checklistTitle}</p>
            {sectionsLoading ? (
              <p className="mt-2 text-xs text-slate-500">{strings.checklistLoading}</p>
            ) : (
              <ul className="mt-2 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {sections.map((section) => (
                  <li
                    key={section.id}
                    className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300"
                  >
                    <FiCheck className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600" aria-hidden />
                    <span>{section.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {showDailyLimit && (
            <p className="text-[11px] text-slate-500 mt-2">
              {formatString(strings.dailyLimit, { limit: PERSONNEL_SELF_EXPORT_DAILY_LIMIT })}
            </p>
          )}
          {downloadButton}
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
