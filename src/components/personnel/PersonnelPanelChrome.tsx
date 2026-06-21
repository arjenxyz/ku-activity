'use client';

import { usePathname } from 'next/navigation';
import { PersonnelAppBottomNav } from '@/components/personnel/PersonnelAppBottomNav';
import { PersonnelPwaInstallBanner } from '@/components/personnel/PersonnelPwaInstallBanner';

function showPersonnelChrome(pathname: string) {
  if (pathname.startsWith('/personnel-panel/login')) return false;
  if (pathname.startsWith('/personnel-panel/basvuru')) return false;
  return pathname.startsWith('/personnel-panel');
}

export function PersonnelPanelChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const withChrome = showPersonnelChrome(pathname);

  if (!withChrome) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:pb-0">{children}</div>
      <PersonnelPwaInstallBanner />
      <PersonnelAppBottomNav />
    </>
  );
}
