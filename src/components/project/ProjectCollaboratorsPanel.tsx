'use client';

import { useCallback, useEffect, useState } from 'react';
import { FiCopy, FiRefreshCw, FiUserMinus, FiUsers } from 'react-icons/fi';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import {
  fetchProjectCollaborators,
  removeProjectCollaboratorApi,
  rotateProjectCollabCode,
  type ProjectCollaboratorRow,
} from '@/lib/project-api';

type Props = {
  projectId: string;
  onOwnerResolved?: (isOwner: boolean) => void;
};

export function ProjectCollaboratorsPanel({ projectId, onOwnerResolved }: Props) {
  const strings = useRegistryStrings('components/modals/ProjectSettingsModal');
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [collaborators, setCollaborators] = useState<ProjectCollaboratorRow[]>([]);
  const [acting, setActing] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProjectCollaborators(projectId);
      setCode(data.code);
      setCollaborators(data.collaborators);
      setForbidden(false);
      onOwnerResolved?.(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : strings.collab.loadFailed;
      if (msg.toLowerCase().includes('sahip') || msg.toLowerCase().includes('owner')) {
        setForbidden(true);
        onOwnerResolved?.(false);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [projectId, onOwnerResolved, strings.collab.loadFailed]);

  useEffect(() => {
    void load();
  }, [load]);

  if (forbidden) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
        {strings.collab.opsOnlyHint}
      </div>
    );
  }

  if (loading) {
    return <p className="text-sm text-slate-500">{strings.collab.loading}</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <FiUsers className="h-4 w-4 text-[#0E1548]" />
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{strings.collab.title}</h3>
      </div>
      <p className="text-xs text-slate-500">{strings.collab.hint}</p>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </p>
      )}

      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-3 dark:border-emerald-900 dark:bg-emerald-950/30">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800/80 dark:text-emerald-200/80">
          {strings.collab.codeLabel}
        </p>
        <p className="mt-1 break-all font-mono text-base font-bold tracking-wide text-slate-900 dark:text-white">
          {code}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={acting || !code}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(code);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 2000);
              } catch {
                setError(strings.collab.copyFailed);
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-emerald-800 disabled:opacity-50"
          >
            <FiCopy className="h-3.5 w-3.5" />
            {copied ? strings.collab.copied : strings.collab.copy}
          </button>
          <button
            type="button"
            disabled={acting}
            onClick={async () => {
              setActing(true);
              setError(null);
              try {
                const next = await rotateProjectCollabCode(projectId);
                setCode(next.code);
              } catch (e) {
                setError(e instanceof Error ? e.message : strings.collab.rotateFailed);
              } finally {
                setActing(false);
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50"
          >
            <FiRefreshCw className="h-3.5 w-3.5" />
            {strings.collab.rotate}
          </button>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
          {strings.collab.listTitle}
        </p>
        {collaborators.length === 0 ? (
          <p className="text-xs text-slate-500">{strings.collab.empty}</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-700 dark:border-slate-700">
            {collaborators.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                    {c.fullName || c.email || c.userId.slice(0, 8)}
                  </p>
                  {c.email && c.fullName ? (
                    <p className="truncate text-xs text-slate-500">{c.email}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  disabled={acting}
                  onClick={async () => {
                    if (!window.confirm(strings.collab.removeConfirm)) return;
                    setActing(true);
                    setError(null);
                    try {
                      await removeProjectCollaboratorApi(projectId, c.userId);
                      setCollaborators((list) => list.filter((x) => x.userId !== c.userId));
                    } catch (e) {
                      setError(e instanceof Error ? e.message : strings.collab.removeFailed);
                    } finally {
                      setActing(false);
                    }
                  }}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 disabled:opacity-50"
                >
                  <FiUserMinus className="h-3.5 w-3.5" />
                  {strings.collab.remove}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
