'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AlertBanner } from '@/components/project/AlertBanner';
import { cardClass } from '@/components/project/ui';
import { AdminUiModeToggle } from '@/components/dashboard/AdminUiModeToggle';
import { useAdminUiMode } from '@/hooks/useAdminUiMode';
import { isPathAllowedInSimpleMode } from '@/lib/admin-ui-mode';

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
      <h2 className="text-lg font-semibold text-slate-900">Gelişmiş arayüz gerekli</h2>
      <p className="text-sm text-slate-600">
        Bu sayfa blok yönetimi, bordro, rapor arşivi gibi gelişmiş işlemler içindir. Günlük
        yoklama ve yevmiye için basit arayüzü kullanın.
      </p>
      <AlertBanner
        type="warning"
        message="Basit modda yalnızca yoklama, yevmiye, avans ve onay sayfalarına erişilir."
      />
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <AdminUiModeToggle />
        {projectId && (
          <Link
            href={`/admin-panel/proje/${projectId}`}
            className="text-sm font-medium text-blue-700 hover:underline"
          >
            Günlük işlemlere dön
          </Link>
        )}
        {!projectId && (
          <Link href="/admin-panel" className="text-sm font-medium text-blue-700 hover:underline">
            Proje listesine dön
          </Link>
        )}
      </div>
    </div>
  );
}
