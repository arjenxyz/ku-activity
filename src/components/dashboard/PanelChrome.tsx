'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
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
import { BrandMark } from '@/components/brand/BrandMark';
import { AdminShell } from '@/components/dashboard/AdminShell';
import { AppTopBar } from '@/components/dashboard/AppTopBar';
import { LanguageSwitch } from '@/components/i18n/LanguageSwitch';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { APP_SHORT_NAME } from '@/lib/brand';
import {
  buildAdminEventNav,
  buildStaffEventNav,
  extractEventId,
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

const SIDEBAR_W = 'lg:w-64';

type Props = {
  children: React.ReactNode;
  homeHref: string;
  navItems: NavSection[];
};

function NavLinkRow({
  item,
  active,
  onNavigate,
  dense,
}: {
  item: NavItem;
  active: boolean;
  onNavigate: () => void;
  dense?: boolean;
}) {
  const Icon = NAV_ICONS[item.icon];
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 rounded-xl text-[#0E1548] ${
        dense ? 'px-2 py-2' : 'px-2.5 py-2.5'
      } ${active ? 'bg-[#e8f0ff]' : 'hover:bg-slate-50'}`}
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

function usePanelNavState(homeHref: string, navItems: NavSection[]) {
  const pathname = usePathname() ?? '';
  const searchParams = useSearchParams();
  const [forceRoot, setForceRoot] = useState(false);
  const [eventTitle, setEventTitle] = useState<string | null>(null);

  const role: 'admin' | 'staff' = homeHref.startsWith('/staff') ? 'staff' : 'admin';
  const eventId = extractEventId(pathname, searchParams, role);
  const search = searchParams.toString();

  const eventChildren = eventId
    ? role === 'staff'
      ? buildStaffEventNav(eventId)
      : buildAdminEventNav(eventId)
    : null;

  const listSection = resolveNavSection(pathname, navItems, homeHref);
  const showEventContext = Boolean(eventChildren?.length) && !forceRoot;
  const showListContext = !showEventContext && Boolean(listSection?.children?.length) && !forceRoot;

  useEffect(() => {
    setForceRoot(false);
  }, [pathname, search]);

  useEffect(() => {
    if (!eventId) {
      setEventTitle(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      if (role === 'staff') {
        const { DEMO_EVENTS } = await import('@/lib/demo/data');
        if (!cancelled) {
          setEventTitle(DEMO_EVENTS.find((item) => item.id === eventId)?.title ?? null);
        }
        return;
      }
      const response = await fetch('/api/admin/events');
      const payload = (await response.json().catch(() => null)) as {
        events?: Array<{ id: string; title: string }>;
      } | null;
      if (cancelled) return;
      setEventTitle(payload?.events?.find((item) => item.id === eventId)?.title ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId, role]);

  const contextLabel = showEventContext
    ? eventTitle ?? 'Etkinlik'
    : listSection?.label ?? '';

  const items =
    showEventContext && eventChildren
      ? eventChildren
      : showListContext && listSection?.children
        ? listSection.children
        : navItems;

  return {
    pathname,
    search,
    forceRoot,
    setForceRoot,
    showContext: showEventContext || showListContext,
    contextLabel,
    items,
  };
}

function NavLinksBody({
  homeHref,
  navItems,
  onNavigate,
  onLogout,
}: {
  homeHref: string;
  navItems: NavSection[];
  onNavigate: () => void;
  onLogout: () => void;
}) {
  const { pathname, search, showContext, contextLabel, items, setForceRoot } = usePanelNavState(
    homeHref,
    navItems
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1">
      {showContext ? (
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
              <span className="block truncate text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {contextLabel}
              </span>
              <span className="block text-sm font-medium">Ana menü</span>
            </span>
          </button>
          <div className="mx-2 my-1 h-px bg-slate-100" />
        </>
      ) : null}

      <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto">
        {items.map((item) => (
          <NavLinkRow
            key={`${item.href}:${item.label}`}
            item={item}
            active={isNavItemActive(pathname, item, homeHref, search)}
            onNavigate={onNavigate}
          />
        ))}
      </div>

      <div className="mt-auto space-y-1 border-t border-slate-100 pt-2">
        <LanguageSwitch variant="nav" />
        <button
          type="button"
          onClick={onLogout}
          className="mx-1 mb-1 flex w-[calc(100%-0.5rem)] items-center justify-center gap-2 rounded-2xl bg-[#0E1548] px-4 py-2.5 text-sm font-medium text-white"
        >
          <FiLogOut className="h-4 w-4" aria-hidden />
          Çıkış yap
        </button>
      </div>
    </div>
  );
}

function MobileDrawer({
  homeHref,
  navItems,
  menuOpen,
  setMenuOpen,
  onLogout,
}: {
  homeHref: string;
  navItems: NavSection[];
  menuOpen: boolean;
  setMenuOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  onLogout: () => void;
}) {
  const pathname = usePathname() ?? '';
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname, search, setMenuOpen]);

  return (
    <>
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 lg:hidden ${
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
        className={`fixed right-3 z-50 w-[min(78vw,280px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 transition-transform duration-300 lg:hidden ${
          menuOpen ? 'translate-x-0' : 'pointer-events-none translate-x-[120%]'
        }`}
        style={{ top: 'calc(4.5rem + env(safe-area-inset-top, 0px))' }}
        aria-label="Mobil menü"
        aria-hidden={!menuOpen}
        data-scroll-lock-allow=""
      >
        <div className="flex max-h-[min(80dvh,640px)] flex-col gap-1 overflow-y-auto p-2">
          <NavLinksBody
            homeHref={homeHref}
            navItems={navItems}
            onNavigate={() => setMenuOpen(false)}
            onLogout={onLogout}
          />
        </div>
      </nav>
    </>
  );
}

function DesktopSidebar({
  homeHref,
  navItems,
  onLogout,
}: {
  homeHref: string;
  navItems: NavSection[];
  onLogout: () => void;
}) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 hidden ${SIDEBAR_W} flex-col border-r border-slate-200/80 bg-white/95 px-3 py-4 backdrop-blur-lg lg:flex`}
      aria-label="Yan menü"
    >
      <Link href={homeHref} className="mb-4 flex items-center gap-2.5 px-2" aria-label={APP_SHORT_NAME}>
        <BrandMark size="sm" className="!h-9 !w-9" />
        <span className="text-sm font-bold text-[#0E1548]">{APP_SHORT_NAME}</span>
      </Link>
      <NavLinksBody
        homeHref={homeHref}
        navItems={navItems}
        onNavigate={() => undefined}
        onLogout={onLogout}
      />
    </aside>
  );
}

function PanelNavChrome({
  homeHref,
  navItems,
  menuOpen,
  setMenuOpen,
}: {
  homeHref: string;
  navItems: NavSection[];
  menuOpen: boolean;
  setMenuOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
}) {
  const router = useRouter();

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
    <>
      <DesktopSidebar homeHref={homeHref} navItems={navItems} onLogout={() => void handleLogout()} />
      <MobileDrawer
        homeHref={homeHref}
        navItems={navItems}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        onLogout={() => void handleLogout()}
      />
    </>
  );
}

export function PanelChrome({ children, homeHref, navItems }: Props) {
  const pathname = usePathname() ?? '';
  const [menuOpen, setMenuOpen] = useState(false);

  useBodyScrollLock(menuOpen);

  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, [pathname]);

  return (
    <div className="min-h-[100dvh] overflow-x-clip bg-slate-50">
      <div className="lg:hidden">
        <AppTopBar
          homeHref={homeHref}
          menuOpen={menuOpen}
          onToggleMenu={() => setMenuOpen((value) => !value)}
        />
      </div>

      <div className={`pt-[calc(4.5rem+env(safe-area-inset-top))] lg:pt-0 lg:pl-64`}>
        <AdminShell>{children}</AdminShell>
      </div>

      <Suspense fallback={null}>
        <PanelNavChrome
          homeHref={homeHref}
          navItems={navItems}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
        />
      </Suspense>
    </div>
  );
}
