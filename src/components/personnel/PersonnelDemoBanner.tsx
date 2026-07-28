'use client';

import Link from 'next/link';

/** Girişsiz demo şeridi — tüm dillerde kısa sabit metin. */
export function PersonnelDemoBanner() {
  return (
    <div className="sticky top-0 z-[calc(var(--personnel-topbar-z)+1)] border-b border-amber-500/30 bg-amber-50/95 px-3 py-1.5 text-center text-[11px] font-medium text-amber-900 backdrop-blur dark:border-amber-400/20 dark:bg-amber-950/90 dark:text-amber-100">
      Demo — örnek veriler, giriş yok.{' '}
      <Link href="/personnel-panel/login" className="underline underline-offset-2">
        Gerçek giriş
      </Link>
    </div>
  );
}

export function AdminDemoBanner() {
  return (
    <div className="sticky top-0 z-50 border-b border-amber-500/30 bg-amber-50/95 px-3 py-1.5 text-center text-[11px] font-medium text-amber-900 backdrop-blur dark:border-amber-400/20 dark:bg-amber-950/90 dark:text-amber-100">
      Admin demo — örnek veriler, giriş yok.{' '}
      <Link href="/admin-panel/login" className="underline underline-offset-2">
        Gerçek giriş
      </Link>
    </div>
  );
}
