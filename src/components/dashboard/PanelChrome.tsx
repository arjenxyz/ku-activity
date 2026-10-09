'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FiArrowLeft,
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
import {
  isNavItemActive,
  resolveNavSection,
  type NavIconName,
  type NavItem,
  type NavSection,
} from '@/config/panel-nav';

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
  navItems: NavSection[];
};

function NavLinkRow({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate: () => void;
}) {
  const Icon = NAV_ICONS[item.icon];
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 rounded-xl px-2 py-2 text-[#0E1548] ${
        active ? 'bg-[#e8f0ff]' : 'hover:bg-slate-50'
      }`}
      onClick={onNavigate}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8f0ff]">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1 text-sm font-medium">{item.label}</span>
      <FiChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
    </Link>
  );
}

export function PanelChrome({ children, homeHref, navItems }: Props) {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  /** When a section has children, open on those; user can flip to full root. */
  const [forceRoot, setForceRoot] = useState(false);

  useBodyScrollLock(menuOpen);

  const contextSection = resolveNavSection(pathname, navItems, homeHref);
  const showContext = Boolean(contextSection?.children?.length) && !forceRoot;

  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, [pathname]);

  useEffect(() => {
    setMenuOpen(false);
    setForceRoot(false);
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
    <div className="min-h-[100dvh] overflow-x-clip bg-slate-50">
      <AppTopBar
        homeHref={homeHref}
        menuOpen={menuOpen}
        onToggleMenu={() => {
          setMenuOpen((value) => {
            if (!value) setForceRoot(false);
            return !value;
          });
        }}
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

          {showContext && contextSection ? (
            <>
              <button
                type="button"
                onClick={() => setForceRoot(true)}
                className="flex items-center gap-3 rounded-xl px-2 py-2 text-[#0E1548] hover:bg-slate-50"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100">
                  <FiArrowLeft className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 text-left">
                  <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    {contextSection.label}
                  </span>
                  <span className="block text-sm font-medium">Ana menü</span>
                </span>
              </button>
              <div className="mx-2 my-1 h-px bg-slate-100" />
              {contextSection.children!.map((item) => (
                <NavLinkRow
                  key={`${contextSection.href}:${item.href}:${item.label}`}
                  item={item}
                  active={isNavItemActive(pathname, item, homeHref)}
                  onNavigate={() => setMenuOpen(false)}
                />
              ))}
            </>
          ) : (
            navItems.map((item) => (
              <NavLinkRow
                key={item.href}
                item={item}
                active={isNavItemActive(pathname, item, homeHref)}
                onNavigate={() => setMenuOpen(false)}
              />
            ))
          )}

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
