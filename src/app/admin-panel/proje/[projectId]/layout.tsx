'use client';

import { useParams } from 'next/navigation';
import { AdminProjectBottomNav } from '@/components/dashboard/AdminProjectBottomNav';
import { AdminProjectClosureGate } from '@/components/admin/AdminProjectClosureGate';
import { ProjectNavHub } from '@/components/project/ProjectNavHub';

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const projectId = Array.isArray(params.projectId) ? params.projectId[0] : params.projectId;

  if (!projectId) return <>{children}</>;

  return (
    <AdminProjectClosureGate projectId={projectId}>
      <div className="pb-[calc(5.25rem+env(safe-area-inset-bottom))] sm:pb-4">
        <ProjectNavHub projectId={projectId} />
        <div className="min-w-0">{children}</div>
      </div>
      <AdminProjectBottomNav projectId={projectId} />
    </AdminProjectClosureGate>
  );
}
