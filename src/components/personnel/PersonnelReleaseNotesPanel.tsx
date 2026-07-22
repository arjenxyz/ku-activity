'use client';

import { useEffect, useState } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { formatDate } from '@/lib/format';

type WebUpdateItem = {
  sha: string;
  shortSha: string;
  message: string;
  date: string;
};

export function PersonnelReleaseNotesPanel() {
  const strings = useRegistryStrings('components/personnel/PersonnelSettingsPage');
  const [updates, setUpdates] = useState<WebUpdateItem[]>([]);
  const [latestAt, setLatestAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch('/api/public/web-updates')
      .then(async (res) => {
        const data = (await res.json()) as {
          updates?: WebUpdateItem[];
          latestAt?: string | null;
          error?: string;
        };
        if (!res.ok) throw new Error(data.error || strings.releases.loadFailed);
        if (!cancelled) {
          setUpdates(data.updates ?? []);
          setLatestAt(data.latestAt ?? data.updates?.[0]?.date ?? null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setUpdates([]);
          setLatestAt(null);
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

  if (updates.length === 0) {
    return (
      <div className="rounded-2xl bg-white px-4 py-8 text-center shadow-sm ring-1 ring-black/[0.04] dark:bg-slate-900 dark:ring-white/10">
        <p className="text-sm font-medium text-slate-900 dark:text-white">{strings.releases.emptyTitle}</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{strings.releases.emptyHint}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.04] dark:bg-slate-900 dark:ring-white/10">
      <div className="border-b border-slate-100 px-4 py-4 dark:border-slate-800">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#0E1548]/70 dark:text-blue-300">
          {strings.releases.currentVersion}
        </p>
        <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
          {strings.releases.webUpdatesTitle}
        </p>
        {latestAt ? (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {strings.releases.publishedAt}: {formatDate(latestAt)}
          </p>
        ) : null}
      </div>

      <div className="px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {strings.releases.notesTitle}
        </p>
        <ul className="mt-3 space-y-3">
          {updates.map((item) => (
            <li key={item.sha} className="flex gap-3 text-sm leading-relaxed">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0E1548] dark:bg-blue-400" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block text-slate-800 dark:text-slate-100">{item.message}</span>
                <span className="mt-0.5 block text-[11px] tabular-nums text-slate-400 dark:text-slate-500">
                  {formatDate(item.date)} · {item.shortSha}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
