'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminProjectClosure } from '@/hooks/useAdminProjectClosure';
import { AdminProjectClosureScreen } from '@/components/admin/AdminProjectClosureScreen';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';

export function AdminProjectClosureGate({
  projectId,
  children,
}: {
  projectId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const strings = useRegistryStrings('components/admin/AdminProjectClosureScreen');
  const { inClosure, loading, status } = useAdminProjectClosure(projectId);

  useEffect(() => {
    if (status?.purged || status?.phase === 'purged') {
      router.replace('/admin-panel');
    }
  }, [status?.purged, status?.phase, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <div className="w-10 h-10 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500">{strings.loading}</p>
      </div>
    );
  }

  if (status?.purged || status?.phase === 'purged') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <div className="w-10 h-10 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500">{strings.loading}</p>
      </div>
    );
  }

  if (inClosure && status) {
    return <AdminProjectClosureScreen projectId={projectId} status={status} />;
  }

  return <>{children}</>;
}
