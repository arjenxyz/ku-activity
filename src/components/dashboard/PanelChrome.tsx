'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { AdminShell } from '@/components/dashboard/AdminShell';
import { AppTopBar } from '@/components/dashboard/AppTopBar';
import { cardClass } from '@/components/ui/styles';

export type NavItem = { href: string; label: string };

type Props = {
  children: React.ReactNode;
  homeHref: string;
  subtitle: string;
  navItems: NavItem[];
};

export function PanelChrome({ children, homeHref, subtitle, navItems }: Props) {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, [pathname]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/demo/logout', { method: 'POST' }).catch(() => undefined);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Demo oturumunda Supabase yapılandırılmamış olabilir.
    }
    router.replace('/login');
    router.refresh();
  };

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-slate-50">
      <AppTopBar
        homeHref={homeHref}
        subtitle={subtitle}
        onLogout={() => void handleLogout()}
        onOpenMenu={() => setMenuOpen(true)}
      />
      <AdminShell>
        <nav className="mb-4 hidden gap-2 overflow-x-auto sm:flex" aria-label="Ana menü">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-2xl px-3 py-2 text-sm font-medium transition ${
                  active
                    ? 'bg-[#0E1548] text-white shadow-sm'
                    : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        {children}
      </AdminShell>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 sm:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40"
            aria-label="Kapat"
            onClick={() => setMenuOpen(false)}
          />
          <div className={`absolute inset-x-3 bottom-3 safe-pb ${cardClass} p-3`}>
            <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Menü
            </p>
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block rounded-xl px-3 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
