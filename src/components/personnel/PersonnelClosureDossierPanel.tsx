'use client';

import { useEffect, useState } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { FiCheck, FiDownload, FiShield } from 'react-icons/fi';
import { PERSONNEL_SELF_EXPORT_DAILY_LIMIT } from '@/lib/legal-dossier/types';
import { formatString } from '@/lib/strings/format';

type DossierSection = { id: string; title: string };

function parseFilename(contentDisposition: string | null, fallback: string) {
  if (!contentDisposition) return fallback;
  const match = /filename="([^"]+)"/i.exec(contentDisposition);
  return match?.[1] ?? fallback;
}

type Props = {
  variant?: 'card' | 'closure';
  showDailyLimit?: boolean;
};

export function PersonnelClosureDossierPanel({
  variant = 'card',
  showDailyLimit = true,
}: Props) {
  const strings = useRegistryStrings('components/personnel/PersonnelClosureDossierPanel');
  const [sections, setSections] = useState<DossierSection[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/personnel/my-dossier/sections');
        if (!res.ok) return;
        const data = (await res.json()) as { sections?: DossierSection[] };
        if (!cancelled) setSections(data.sections ?? []);
      } catch {
        if (!cancelled) setSections([]);
      } finally {
        if (!cancelled) setSectionsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDownload = async () => {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.errors.generic);
    } finally {
      setLoading(false);
    }
  };

  const checklist = (
    <div className="mt-3">
      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
        {strings.checklistTitle}
      </p>
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
  );

  const downloadButton = (
    <button
      type="button"
      onClick={() => void handleDownload()}
      disabled={loading}
      className={
        variant === 'closure'
          ? 'w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50'
          : 'mt-3 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50'
      }
    >
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          {strings.preparing}
        </>
      ) : (
        <>
          <FiDownload className="w-4 h-4" />
          {strings.downloadCta}
        </>
      )}
    </button>
  );

  if (variant === 'closure') {
    return (
      <div className="rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/80 dark:bg-amber-950/30 p-4 sm:p-5">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">{strings.closureTitle}</p>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
          {strings.closureDescription}
        </p>
        {checklist}
        {showDailyLimit && (
          <p className="text-[11px] text-slate-500 mt-2">
            {formatString(strings.dailyLimit, { limit: PERSONNEL_SELF_EXPORT_DAILY_LIMIT })}
          </p>
        )}
        <div className="mt-3">{downloadButton}</div>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
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
          {checklist}
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
