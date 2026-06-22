'use client';

import { usePathname } from 'next/navigation';
import { PersonnelAppBottomNav } from '@/components/personnel/PersonnelAppBottomNav';
import { PersonnelMobileHeader } from '@/components/personnel/PersonnelMobileHeader';

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
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 sm:bg-transparent">
      <PersonnelMobileHeader />
      <div className="pt-[calc(3.5rem+env(safe-area-inset-top))] pb-[calc(4.75rem+env(safe-area-inset-bottom))] sm:pt-0 sm:pb-0">
        {children}
      </div>
      <PersonnelAppBottomNav />
    </div>
  );
}
