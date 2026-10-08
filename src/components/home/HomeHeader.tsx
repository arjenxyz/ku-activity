'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiCalendar, FiChevronRight, FiClipboard, FiLogOut, FiUsers } from 'react-icons/fi';
import { MdQrCode } from 'react-icons/md';
import { BrandMark } from '@/components/brand/BrandMark';
import { LanguageSwitch } from '@/components/i18n/LanguageSwitch';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import type { AppRole } from '@/lib/auth/roles';
import { homePathForRole } from '@/lib/auth/roles';
import { APP_NAME, APP_TAGLINE } from '@/lib/brand';
import { createClient } from '@/utils/supabase/client';

const PUBLIC_LINKS = [
  { href: '/etkinlikler', label: 'Etkinlikler', icon: FiCalendar },
  { href: '/ekip', label: 'Ekip üyeleri', icon: FiUsers },
];

const STUDENT_LINKS = [
  { href: '/etkinlikler', label: 'Etkinlikler', icon: FiCalendar },
  { href: '/kayitlarim', label: 'Kayıtlarım', icon: FiClipboard },
  { href: '/qr', label: 'QR kodum', icon: MdQrCode },
  { href: '/ekip', label: 'Ekip üyeleri', icon: FiUsers },
];

type SiteSession = {
  role: AppRole;
  name: string;
  demo: boolean;
};

export function ExploreMenuButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event('ems-open-menu'))}
    >
      Keşfet
    </button>
  );
}

export function HomeHeader() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [session, setSession] = useState<SiteSession | null>(null);
  const headerRef = useRef<HTMLElement>(null);

  useBodyScrollLock(open);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const openMenu = () => setOpen(true);
    window.addEventListener('ems-open-menu', openMenu);
    return () => window.removeEventListener('ems-open-menu', openMenu);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/session')
      .then((res) => res.json())
      .then((payload: { session?: SiteSession | null }) => {
        if (!cancelled) setSession(payload.session ?? null);
      })
      .catch(() => {
        if (!cancelled) setSession(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const sync = () => {
      document.documentElement.style.setProperty('--home-chrome-h', `${el.offsetHeight}px`);
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => observer.disconnect();
  }, [open]);

  const isStudent = session?.role === 'student';
  const isStaffPanel = session?.role === 'admin' || session?.role === 'staff';
  const menuLinks = isStudent ? STUDENT_LINKS : PUBLIC_LINKS;

  async function logout() {
    setOpen(false);
    await fetch('/api/demo/logout', { method: 'POST' }).catch(() => undefined);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Demo oturumunda Supabase yapılandırılmamış olabilir.
    }
    setSession(null);
    router.replace('/');
    router.refresh();
  }

  return (
    <>
      <header
        ref={headerRef}
        className="fixed inset-x-0 top-0 z-50 bg-transparent px-3 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-6 lg:px-8"
      >
        <div
          className={`mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-2xl border px-3 py-2 shadow-sm transition-all duration-300 sm:px-4 ${
            open || scrolled
              ? 'border-slate-200 bg-white shadow-md shadow-slate-900/[0.06]'
              : 'border-slate-200/80 bg-white/95 backdrop-blur-lg'
          }`}
        >
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <BrandMark size="sm" className="!h-9 !w-9" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-[#0E1548]">{APP_NAME}</span>
              <span className="hidden truncate text-[10px] text-slate-500 sm:block">{APP_TAGLINE}</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Sayfa">
            {menuLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-[#0E1548]"
              >
                {item.label}
              </Link>
            ))}
            <LanguageSwitch variant="compact" />
            {session ? (
              isStaffPanel ? (
                <Link
                  href={homePathForRole(session.role)}
                  className="ml-2 rounded-2xl bg-[#0E1548] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#152060]"
                >
                  Panele git
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="ml-2 rounded-2xl bg-[#0E1548] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#152060]"
                >
                  Çıkış
                </button>
              )
            ) : (
              <Link
                href="/login"
                className="ml-2 rounded-2xl bg-[#0E1548] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#152060]"
              >
                Giriş yap
              </Link>
            )}
          </nav>

          <button
            type="button"
            className="flex h-10 w-10 flex-col items-center justify-center rounded-xl hover:bg-slate-100 md:hidden"
            aria-label={open ? 'Menüyü kapat' : 'Menüyü aç'}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <span className={`block h-0.5 w-5 rounded-sm bg-[#0E1548] transition ${open ? 'translate-y-1 rotate-45' : ''}`} />
            <span className={`my-1 block h-0.5 w-5 rounded-sm bg-[#0E1548] transition ${open ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 w-5 rounded-sm bg-[#0E1548] transition ${open ? '-translate-y-1 -rotate-45' : ''}`} />
          </button>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden={!open}
      >
        <button
          type="button"
          className="absolute inset-0 bg-[#0E1548]/60 backdrop-blur-2xl"
          aria-label="Menüyü kapat"
          onClick={() => setOpen(false)}
        />
        <nav
          className="absolute inset-x-0 bottom-6 flex items-center justify-center gap-6 px-4 safe-pb"
          aria-label="Yasal"
        >
          <Link href="/gizlilik" className="text-sm text-white/90 hover:text-white" onClick={() => setOpen(false)}>
            Gizlilik
          </Link>
          <Link href="/kvkk" className="text-sm text-white/90 hover:text-white" onClick={() => setOpen(false)}>
            KVKK
          </Link>
        </nav>
      </div>
      <nav
        className={`fixed right-3 z-50 w-[min(78vw,280px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 transition-transform duration-300 ${
          open ? 'translate-x-0' : 'pointer-events-none translate-x-[120%]'
        }`}
        style={{ top: 'calc(var(--home-chrome-h, 4rem) + 0.5rem)' }}
        aria-label="Mobil menü"
        aria-hidden={!open}
        data-scroll-lock-allow=""
      >
        <div className="flex flex-col gap-1 p-2">
          <LanguageSwitch variant="nav" />
          <div className="mx-2 my-1 h-px bg-slate-100" />
          {session ? (
            <p className="px-3 py-1.5 text-xs font-medium text-slate-500">
              {session.name}
              {session.demo ? ' · demo' : ''}
            </p>
          ) : null}
          {menuLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className="flex items-center gap-3 rounded-xl px-2 py-2 text-[#0E1548] hover:bg-slate-50"
                onClick={() => setOpen(false)}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8f0ff]">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 text-sm font-medium">{item.label}</span>
                <FiChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              </Link>
            );
          })}
          {session ? (
            isStaffPanel ? (
              <Link
                href={homePathForRole(session.role)}
                className="mx-1 mb-1 mt-1 flex items-center justify-center rounded-2xl bg-[#0E1548] px-4 py-2.5 text-sm font-medium text-white"
                onClick={() => setOpen(false)}
              >
                Panele git
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => void logout()}
                className="mx-1 mb-1 mt-1 flex items-center justify-center gap-2 rounded-2xl bg-[#0E1548] px-4 py-2.5 text-sm font-medium text-white"
              >
                <FiLogOut className="h-4 w-4" aria-hidden />
                Çıkış yap
              </button>
            )
          ) : (
            <Link
              href="/login"
              className="mx-1 mb-1 mt-1 flex items-center justify-center rounded-2xl bg-[#0E1548] px-4 py-2.5 text-sm font-medium text-white"
              onClick={() => setOpen(false)}
            >
              Giriş yap
            </Link>
          )}
        </div>
      </nav>
    </>
  );
}
