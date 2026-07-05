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
    <article className="relative overflow-hidden rounded-3xl border border-amber-200/70 dark:border-amber-800/40 bg-gradient-to-b from-amber-50/90 via-white to-white dark:from-amber-950/30 dark:to-slate-900 p-5 shadow-[0_8px_30px_rgba(245,158,11,0.1)] flex flex-col gap-4">
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-200/40 blur-2xl"
        aria-hidden
      />

      <div className="relative w-full min-w-0 text-center">
        <h3 className="font-bold text-slate-900 dark:text-white truncate tracking-tight">{project.name}</h3>
        {project.code && <p className="text-xs text-slate-400 mt-0.5 font-medium">#{project.code}</p>}
        <span className="inline-flex mt-2 px-2.5 py-1 rounded-full bg-amber-100/90 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 text-[11px] font-semibold">
          {strings.closureBadge}
        </span>
      </div>

      <ClosureCountdown
        deadlineAt={project.closure_deadline_at ?? null}
        phase={project.closure_phase}
        size="md"
        variant="premium"
        className="relative w-full"
      />

      <ProjectLegalDossierDownloadButton
        projectId={project.id}
        projectName={project.name}
        compact
        premium
        className="relative w-full"
      />
    </article>
  );
}
