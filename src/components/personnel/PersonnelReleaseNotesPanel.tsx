'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { formatDate } from '@/lib/format';
import { formatApkFileSize } from '@/lib/app-releases';

type PersonnelRelease = {
  appType: string;
  id: string | null;
  versionName?: string;
  versionCode?: number;
  fileSize?: number;
  releaseNotes?: string | null;
  publishedAt?: string | null;
};

function parseReleaseNotes(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-*•]\s*/, ''));
}

export function PersonnelReleaseNotesPanel() {
  const strings = useRegistryStrings('components/personnel/PersonnelSettingsPage');
  const [release, setRelease] = useState<PersonnelRelease | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch('/api/public/releases')
      .then(async (res) => {
        const data = (await res.json()) as {
          releases?: PersonnelRelease[];
          error?: string;
        };
        if (!res.ok) throw new Error(data.error || strings.releases.loadFailed);
        const personnel = (data.releases ?? []).find((row) => row.appType === 'personnel');
        if (!cancelled) setRelease(personnel ?? null);
      })
      .catch((err) => {
        if (!cancelled) {
          setRelease(null);
          setError(err instanceof Error ? err.message : strings.releases.loadFailed);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [strings.releases.loadFailed]);

  if (loading) {
    return (
      <div className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-slate-500 shadow-sm ring-1 ring-black/[0.04] dark:bg-slate-900 dark:ring-white/10">
        {strings.releases.loading}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-red-50 px-4 py-6 text-center text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
        {error}
      </div>
    );
  }

  if (!release?.id) {
    return (
      <div className="rounded-2xl bg-white px-4 py-8 text-center shadow-sm ring-1 ring-black/[0.04] dark:bg-slate-900 dark:ring-white/10">
        <p className="text-sm font-medium text-slate-900 dark:text-white">{strings.releases.emptyTitle}</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{strings.releases.emptyHint}</p>
      </div>
    );
  }

  const notes = release.releaseNotes?.trim();
  const noteLines = notes ? parseReleaseNotes(notes) : [];

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.04] dark:bg-slate-900 dark:ring-white/10">
        <div className="border-b border-slate-100 bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/50 px-4 py-4 dark:border-slate-800 dark:from-blue-950/30 dark:via-slate-900 dark:to-indigo-950/20">
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            {strings.releases.currentVersion}
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            {release.versionName ?? '—'}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            {release.publishedAt ? (
              <span>
                {strings.releases.publishedAt}: {formatDate(release.publishedAt)}
              </span>
            ) : null}
            {typeof release.fileSize === 'number' ? (
              <span>{formatApkFileSize(release.fileSize)}</span>
            ) : null}
          </div>
        </div>

        <div className="px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {strings.releases.notesTitle}
          </p>
          {noteLines.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {noteLines.map((line, index) => (
                <li
                  key={`${index}-${line.slice(0, 24)}`}
                  className="flex gap-2.5 text-sm leading-relaxed text-slate-700 dark:text-slate-200"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{strings.releases.noNotes}</p>
          )}
        </div>
      </div>

      <p className="px-1 text-center text-xs text-slate-500 dark:text-slate-400">
        {strings.releases.apkHint}{' '}
        <Link href="/apk" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
          {strings.releases.apkLink}
        </Link>
      </p>
    </div>
  );
}
