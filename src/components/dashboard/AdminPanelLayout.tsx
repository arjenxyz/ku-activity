'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AdminPanelChrome } from './AdminPanelChrome';

export function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminArea = pathname?.startsWith('/admin-panel');

  useEffect(() => {
    if (!isAdminArea) return;
    document.documentElement.classList.remove('dark');
  }, [isAdminArea]);

  if (
    pathname === '/admin-panel/login' ||
    pathname === '/admin-panel/register' ||
    pathname === '/admin-panel/dekont-paylas'
  ) {
    return <>{children}</>;
  }
  return <AdminPanelChrome>{children}</AdminPanelChrome>;
}
