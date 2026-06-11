'use client';

import { useParams } from 'next/navigation';
import { ProjectNavMenu } from '@/components/project/ProjectNavMenu';

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const projectId = Array.isArray(params.projectId) ? params.projectId[0] : params.projectId;

  if (!projectId) return <>{children}</>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex gap-8 items-start">
        <ProjectNavMenu projectId={projectId} />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
