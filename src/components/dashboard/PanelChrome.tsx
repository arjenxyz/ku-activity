'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
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
import { AdminShell } from '@/components/dashboard/AdminShell';
import { AppTopBar } from '@/components/dashboard/AppTopBar';
import { LanguageSwitch } from '@/components/i18n/LanguageSwitch';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
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

function PanelMenu({
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
  const pathname = usePathname() ?? '';
  const searchParams = useSearchParams();
  const router = useRouter();
  const [forceRoot, setForceRoot] = useState(false);
  const [eventTitle, setEventTitle] = useState<string | null>(null);
  const wasOpen = useRef(false);

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
    setMenuOpen(false);
    setForceRoot(false);
  }, [pathname, search, setMenuOpen]);

  useEffect(() => {
    if (menuOpen && !wasOpen.current) setForceRoot(false);
    wasOpen.current = menuOpen;
  }, [menuOpen]);

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

  const contextLabel = showEventContext
    ? eventTitle ?? 'Etkinlik'
    : listSection?.label ?? '';

  return (
    <>
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
        <div className="flex max-h-[min(80dvh,640px)] flex-col gap-1 overflow-y-auto p-2">
          <LanguageSwitch variant="nav" />
          <div className="mx-2 my-1 h-px bg-slate-100" />

          {showEventContext || showListContext ? (
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
              {(showEventContext ? eventChildren! : listSection!.children!).map((item) => (
                <NavLinkRow
                  key={`${item.href}:${item.label}`}
                  item={item}
                  active={isNavItemActive(pathname, item, homeHref, search)}
                  onNavigate={() => setMenuOpen(false)}
                />
              ))}
            </>
          ) : (
            navItems.map((item) => (
              <NavLinkRow
                key={item.href}
                item={item}
                active={isNavItemActive(pathname, item, homeHref, search)}
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
      <AppTopBar
        homeHref={homeHref}
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((value) => !value)}
      />

      <div className="pt-[calc(4.5rem+env(safe-area-inset-top))]">
        <AdminShell>{children}</AdminShell>
      </div>

      <Suspense fallback={null}>
        <PanelMenu
          homeHref={homeHref}
          navItems={navItems}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
        />
      </Suspense>
    </div>
  );
}
