'use client';

import { useParams } from 'next/navigation';
import { ProjectNavMenu } from '@/components/project/ProjectNavMenu';
import { AdminProjectBottomNav } from '@/components/dashboard/AdminProjectBottomNav';
import { AdminProjectClosureGate } from '@/components/admin/AdminProjectClosureGate';

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const projectId = Array.isArray(params.projectId) ? params.projectId[0] : params.projectId;

  if (!projectId) return <>{children}</>;

  return (
    <AdminProjectClosureGate projectId={projectId}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:pb-8">
        <div className="flex gap-8 items-start">
          <ProjectNavMenu projectId={projectId} />
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
      <AdminProjectBottomNav projectId={projectId} />
    </AdminProjectClosureGate>
  );
}
