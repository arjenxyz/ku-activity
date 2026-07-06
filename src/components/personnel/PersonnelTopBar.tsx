'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandMark } from '@/components/brand/BrandMark';
import { PersonnelNotificationsBell } from '@/components/personnel/PersonnelNotificationsBell';

function isImmersivePath(pathname: string) {
  return (
    pathname.startsWith('/personnel-panel/yoklama') ||
    pathname.startsWith('/personnel-panel/avans-onay')
  );
}

export function PersonnelTopBar() {
  const pathname = usePathname() ?? '';
  const immersive = isImmersivePath(pathname);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-[60] safe-pt border-b backdrop-blur-md ${
        immersive
          ? 'border-white/10 bg-black/50'
          : 'border-slate-200/70 bg-white/95 dark:border-slate-800/70 dark:bg-slate-900/95'
      }`}
    >
      <div className="mx-auto flex h-12 max-w-5xl items-center justify-between gap-3 px-4">
        <Link
          href="/personnel-panel"
          className="flex min-w-0 items-center gap-2 transition-opacity hover:opacity-90 active:opacity-80"
        >
          <BrandMark
            size="sm"
            className={immersive ? 'ring-2 ring-white/20 shadow-lg' : 'shadow-md shadow-blue-500/15'}
          />
          <span
            className={`truncate text-xs font-semibold tracking-[0.1em] ${
              immersive ? 'text-white' : 'text-[#0E1548] dark:text-white'
            }`}
          >
            CREWLEDGER
          </span>
        </Link>
        <PersonnelNotificationsBell tone={immersive ? 'onDark' : 'light'} />
      </div>
    </header>
  );
}
