'use client';

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
    <div className="mx-auto max-w-md w-full py-8 sm:py-12">
      <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-gradient-to-b from-amber-50 to-white dark:from-amber-950/40 dark:to-slate-900 p-6 sm:p-8 shadow-sm text-center space-y-6">
        {name ? (
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 truncate">{name}</p>
        ) : null}
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{strings.title}</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{strings.description}</p>
        </div>

        <ClosureCountdown
          deadlineAt={status.deadlineAt}
          phase={status.phase}
          size="lg"
          className="py-2"
        />

        <div className="pt-2">
          <ProjectLegalDossierDownloadButton
            projectId={projectId}
            projectName={name}
            compact
            className="flex flex-col items-center w-full"
          />
        </div>
      </div>
    </div>
  );
}
