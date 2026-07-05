'use client';

import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { ClosureCountdown } from '@/components/closure/ClosureCountdown';
import { ProjectLegalDossierDownloadButton } from '@/components/admin/ProjectLegalDossierDownloadButton';
import type { Project } from '@/types/project';

type Props = {
  project: Project;
};

export function ProjectClosureListCard({ project }: Props) {
  const strings = useRegistryStrings('app/admin-panel/proje/ProjectList');

  return (
    <article className="bg-gradient-to-b from-amber-50 to-white dark:from-amber-950/30 dark:to-slate-900 border border-amber-200/80 dark:border-amber-900/50 rounded-2xl p-5 shadow-sm flex flex-col items-center text-center gap-4">
      <div className="w-full min-w-0">
        <h3 className="font-semibold text-slate-900 dark:text-white truncate">{project.name}</h3>
        <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">{strings.closureBadge}</p>
      </div>

      <ClosureCountdown
        deadlineAt={project.closure_deadline_at ?? null}
        phase={project.closure_phase}
        size="md"
        className="w-full"
      />

      <ProjectLegalDossierDownloadButton
        projectId={project.id}
        projectName={project.name}
        compact
        className="w-full"
      />
    </article>
  );
}
