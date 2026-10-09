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
  FiUser,
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
import type { AppRole } from '@/lib/auth/roles';
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

const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Yönetici',
  staff: 'Görevli',
  student: 'Öğrenci',
};

function PanelSessionCard({ compact }: { compact?: boolean }) {
  const [session, setSession] = useState<{ name: string; role: AppRole; demo: boolean } | null>(
    null
  );

  useEffect(() => {
    void (async () => {
      const response = await fetch('/api/session');
      const payload = (await response.json().catch(() => null)) as {
        session?: { name: string; role: AppRole; demo: boolean } | null;
      } | null;
      setSession(payload?.session ?? null);
    })();
  }, []);

  const name = session?.name ?? 'Oturum…';
  const meta = session
    ? `${ROLE_LABELS[session.role]}${session.demo ? ' · Demo' : ''}`
    : '…';

  return (
    <div
      className={`flex items-center gap-2.5 ${compact ? 'px-1 py-1' : 'px-1 py-0.5'}`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0E1548] text-white">
        <FiUser className="h-3.5 w-3.5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`block truncate font-semibold text-[#0E1548] ${
            session ? 'text-sm' : 'text-sm text-slate-400'
          }`}
        >
          {name}
        </span>
        <span className="block truncate text-[11px] text-slate-500">{meta}</span>
      </span>
    </div>
  );
}

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
  showChevron,
}: {
  item: NavItem;
  active: boolean;
  onNavigate: () => void;
  showChevron?: boolean;
}) {
  const Icon = NAV_ICONS[item.icon];
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[#0E1548] transition ${
        active ? 'bg-[#e8f0ff] font-semibold' : 'font-medium hover:bg-slate-50'
      }`}
      onClick={onNavigate}
    >
      <Icon
        className={`h-4 w-4 shrink-0 ${active ? 'text-[#2D6AF6]' : 'text-slate-500'}`}
        aria-hidden
      />
      <span className="min-w-0 flex-1 truncate text-sm">{item.label}</span>
      {showChevron ? (
        <FiChevronRight className="h-4 w-4 shrink-0 text-slate-300" aria-hidden />
      ) : null}
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
  layout,
}: {
  homeHref: string;
  navItems: NavSection[];
  onNavigate: () => void;
  onLogout: () => void;
  layout: 'sidebar' | 'drawer';
}) {
  const { pathname, search, showContext, contextLabel, items, setForceRoot } = usePanelNavState(
    homeHref,
    navItems
  );
  const isSidebar = layout === 'sidebar';

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {showContext ? (
        <div className="mb-2 space-y-1">
          <button
            type="button"
            onClick={() => setForceRoot(true)}
            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[#0E1548] hover:bg-slate-50"
          >
            <FiArrowLeft className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {contextLabel}
              </span>
              <span className="block text-sm font-medium">Ana menü</span>
            </span>
          </button>
          <div className="mx-2 h-px bg-slate-100" />
        </div>
      ) : null}

      <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-0.5" aria-label="Sayfalar">
        {items.map((item) => (
          <NavLinkRow
            key={`${item.href}:${item.label}`}
            item={item}
            active={isNavItemActive(pathname, item, homeHref, search)}
            onNavigate={onNavigate}
            showChevron={false}
          />
        ))}
      </nav>

      <div className="mt-3 shrink-0 space-y-2 rounded-2xl border border-slate-100 bg-slate-50/80 p-2.5">
        {isSidebar ? (
          <>
            <PanelSessionCard compact />
            <div className="h-px bg-slate-200/70" />
          </>
        ) : null}
        <div className="flex items-center justify-between gap-2 px-1">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Dil</span>
          <LanguageSwitch variant="compact" />
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0E1548] px-3 py-2.5 text-sm font-medium text-white hover:bg-[#152060]"
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
        <div className="flex max-h-[min(80dvh,640px)] flex-col overflow-y-auto p-2">
          <NavLinksBody
            homeHref={homeHref}
            navItems={navItems}
            onNavigate={() => setMenuOpen(false)}
            onLogout={onLogout}
            layout="drawer"
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
      className={`fixed inset-y-0 left-0 z-40 hidden ${SIDEBAR_W} flex-col border-r border-slate-200/80 bg-white lg:flex`}
      aria-label="Yan menü"
    >
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-slate-100 px-4">
        <Link href={homeHref} className="flex min-w-0 items-center gap-2.5" aria-label={APP_SHORT_NAME}>
          <BrandMark size="sm" className="!h-8 !w-8" />
          <span className="truncate text-sm font-bold tracking-tight text-[#0E1548]">
            {APP_SHORT_NAME}
          </span>
        </Link>
      </div>
      <div className="flex min-h-0 flex-1 flex-col px-2.5 py-3">
        <NavLinksBody
          homeHref={homeHref}
          navItems={navItems}
          onNavigate={() => undefined}
          onLogout={onLogout}
          layout="sidebar"
        />
      </div>
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
