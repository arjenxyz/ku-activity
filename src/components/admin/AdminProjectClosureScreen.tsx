'use client';

import { FiArchive, FiDownload } from 'react-icons/fi';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { ClosureCountdown } from '@/components/closure/ClosureCountdown';
import { ProjectLegalDossierDownloadButton } from '@/components/admin/ProjectLegalDossierDownloadButton';
import type { AdminProjectClosureStatus } from '@/hooks/useAdminProjectClosure';

type Props = {
  projectId: string;
  status: AdminProjectClosureStatus;
  projectName?: string;
};

export function AdminProjectClosureScreen({ projectId, status, projectName }: Props) {
  const strings = useRegistryStrings('components/admin/AdminProjectClosureScreen');
  const name = projectName ?? status.projectName ?? '';

  return (
    <div className="mx-auto max-w-md w-full py-8 sm:py-12 px-2">
      <div className="relative">
        <div
          className="pointer-events-none absolute inset-x-4 -top-6 h-40 rounded-full bg-amber-200/25 blur-3xl"
          aria-hidden
        />

        <div className="relative space-y-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-900 text-white shadow-lg mb-3">
              <FiArchive className="w-5 h-5" />
            </div>
            {name ? (
              <p className="text-sm font-medium text-slate-500 truncate max-w-xs mx-auto">{name}</p>
            ) : null}
            <h1 className="mt-1 text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {strings.title}
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
              {strings.description}
            </p>
          </div>

          <div className="rounded-3xl border border-amber-200/70 dark:border-amber-800/40 bg-gradient-to-br from-amber-50 via-orange-50/40 to-white dark:from-amber-950/30 dark:to-slate-900 p-6 shadow-[0_12px_40px_rgba(245,158,11,0.1)]">
            <ClosureCountdown
              deadlineAt={status.deadlineAt}
              phase={status.phase}
              size="lg"
              variant="premium"
            />
          </div>

          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 p-6 shadow-[0_12px_40px_rgba(14,21,72,0.06)] text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 mb-3">
              <FiDownload className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{strings.downloadHint}</p>
            <div className="mt-4">
              <ProjectLegalDossierDownloadButton
                projectId={projectId}
                projectName={name}
                compact
                premium
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
