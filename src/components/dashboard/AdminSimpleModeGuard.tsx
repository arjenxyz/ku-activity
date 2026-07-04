'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AlertBanner } from '@/components/project/AlertBanner';
import { cardClass } from '@/components/project/ui';
import { AdminUiModeToggle } from '@/components/dashboard/AdminUiModeToggle';
import { useAdminUiMode } from '@/hooks/useAdminUiMode';
import { isPathAllowedInSimpleMode } from '@/lib/admin-ui-mode';
import strings from '@json/src/components/dashboard/AdminSimpleModeGuard.json';

export function AdminSimpleModeGuard({
  projectId,
  children,
}: {
  projectId: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isSimple, ready } = useAdminUiMode();

  if (!ready || !isSimple) return <>{children}</>;
  if (isPathAllowedInSimpleMode(projectId, pathname)) return <>{children}</>;

  return (
    <div className={`${cardClass} p-8 max-w-lg mx-auto text-center space-y-4`}>
      <h2 className="text-lg font-semibold text-slate-900">{strings.title}</h2>
      <p className="text-sm text-slate-600">{strings.description}</p>
      <AlertBanner type="warning" message={strings.warningMessage} />
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <AdminUiModeToggle />
        {projectId && (
          <Link
            href={`/admin-panel/proje/${projectId}`}
            className="text-sm font-medium text-blue-700 hover:underline"
          >
            {strings.backToDaily}
          </Link>
        )}
        {!projectId && (
          <Link href="/admin-panel" className="text-sm font-medium text-blue-700 hover:underline">
            {strings.backToProjects}
          </Link>
        )}
      </div>
    </div>
  );
}
