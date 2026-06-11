'use client';

import { usePathname } from 'next/navigation';

export default function DeveloperLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/developer-panel/login') {
    return <>{children}</>;
  }
  return <>{children}</>;
}
