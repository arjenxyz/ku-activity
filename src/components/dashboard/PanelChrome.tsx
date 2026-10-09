'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FiCalendar,
  FiCheckSquare,
  FiChevronRight,
  FiClipboard,
  FiFileText,
  FiHome,
  FiLogOut,
  FiSettings,
  FiUsers,
} from 'react-icons/fi';
import type { IconType } from 'react-icons';
import { createClient } from '@/utils/supabase/client';
import { AdminShell } from '@/components/dashboard/AdminShell';
import { AppTopBar } from '@/components/dashboard/AppTopBar';
import { LanguageSwitch } from '@/components/i18n/LanguageSwitch';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import type { NavIconName, NavItem } from '@/config/panel-nav';

const NAV_ICONS: Record<NavIconName, IconType> = {
  home: FiHome,
  calendar: FiCalendar,
  users: FiUsers,
  check: FiCheckSquare,
  file: FiFileText,
  clipboard: FiClipboard,
  settings: FiSettings,
};


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

  useBodyScrollLock(menuOpen);

  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, [pathname]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    setMenuOpen(false);
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
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((value) => !value)}
      />

      <div className="pt-[calc(4.5rem+env(safe-area-inset-top))]">
        <AdminShell>{children}</AdminShell>
      </div>

      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${
          menuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          className="absolute inset-0 bg-[#0E1548]/60 backdrop-blur-2xl"
          aria-label="Menüyü kapat"
          onClick={() => setMenuOpen(false)}
        />
      </div>

      <nav
        className={`fixed right-3 z-50 w-[min(78vw,280px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 transition-transform duration-300 ${
          menuOpen ? 'translate-x-0' : 'pointer-events-none translate-x-[120%]'
        }`}
        style={{ top: 'calc(4.5rem + env(safe-area-inset-top, 0px))' }}
        aria-label="Mobil menü"
        aria-hidden={!menuOpen}
        data-scroll-lock-allow=""
      >
        <div className="flex flex-col gap-1 p-2">
          <LanguageSwitch variant="nav" />
          <div className="mx-2 my-1 h-px bg-slate-100" />
          <p className="px-3 py-1.5 text-xs font-medium text-slate-500">{subtitle}</p>
          <div className="mx-2 my-1 h-px bg-slate-100" />
          {navItems.map((item) => {
            const Icon = NAV_ICONS[item.icon];
            const active =
              item.href === homeHref
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-2 py-2 text-[#0E1548] ${
                  active ? 'bg-[#e8f0ff]' : 'hover:bg-slate-50'
                }`}
                onClick={() => setMenuOpen(false)}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8f0ff]">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 text-sm font-medium">{item.label}</span>
                <FiChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="mx-1 mb-1 mt-1 flex items-center justify-center gap-2 rounded-2xl bg-[#0E1548] px-4 py-2.5 text-sm font-medium text-white"
          >
            <FiLogOut className="h-4 w-4" aria-hidden />
            Çıkış yap
          </button>
        </div>
      </nav>
    </div>
  );
}
