'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { FiGrid, FiLogOut } from 'react-icons/fi';
import { ProjectNavLinks } from '@/components/project/ProjectNavMenu';

const PROJECT_ID_RE = /^\/admin-panel\/proje\/([a-f0-9-]{36})/;

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const projectId = useMemo(() => pathname.match(PROJECT_ID_RE)?.[1] ?? null, [pathname]);
  const isProjectsHome = pathname === '/admin-panel';

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    await fetch('/api/auth/admin/logout', { method: 'POST' });
    window.location.href = '/admin-panel/login';
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/admin-panel" className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              A
            </div>
            <span className="font-semibold text-slate-900 truncate">ArjenDev</span>
          </Link>

          {/* Masaüstü — proje sayfasında sol menü var, burada sadece genel */}
          <div className="hidden sm:flex items-center gap-1">
            <Link
              href="/admin-panel"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isProjectsHome
                  ? 'text-blue-700 bg-blue-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FiGrid className="w-4 h-4" />
              Projeler
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <FiLogOut className="w-4 h-4" />
              Çıkış
            </button>
          </div>

          {/* Mobil — tek menü: genel + proje linkleri */}
          <button
            type="button"
            className="sm:hidden flex flex-col justify-center items-center w-10 h-10 rounded-lg hover:bg-slate-100 transition-colors"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
            aria-expanded={menuOpen}
          >
            <span
              className={`bg-blue-600 block h-0.5 w-5 rounded-full transition-all duration-300 ${
                menuOpen ? 'rotate-45 translate-y-1' : '-translate-y-0.5'
              }`}
            />
            <span
              className={`bg-blue-600 block h-0.5 w-5 rounded-full my-1 transition-all duration-300 ${
                menuOpen ? 'opacity-0' : 'opacity-100'
              }`}
            />
            <span
              className={`bg-blue-600 block h-0.5 w-5 rounded-full transition-all duration-300 ${
                menuOpen ? '-rotate-45 -translate-y-1' : 'translate-y-0.5'
              }`}
            />
          </button>
        </div>
      </header>

      {/* Mobil yan panel — tek menü */}
      <div
        className={`fixed inset-0 z-40 sm:hidden transition-opacity duration-300 ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!menuOpen}
      >
        <div
          className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
          onClick={closeMenu}
        />
        <nav
          className={`absolute top-0 right-0 h-full w-[min(100%,300px)] bg-white shadow-xl transition-transform duration-300 flex flex-col ${
            menuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex-1 overflow-y-auto pt-16 px-4 pb-4">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2">
              Genel
            </p>
            <Link
              href="/admin-panel"
              onClick={closeMenu}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium mb-4 ${
                isProjectsHome ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <FiGrid className="w-5 h-5" />
              Projeler
            </Link>

            {projectId && (
              <>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2">
                  Proje Menüsü
                </p>
                <ProjectNavLinks projectId={projectId} onNavigate={closeMenu} />
              </>
            )}
          </div>

          <div className="shrink-0 p-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-red-600 border border-red-100 bg-red-50 hover:bg-red-100 transition-colors"
            >
              <FiLogOut className="w-4 h-4" />
              Çıkış Yap
            </button>
          </div>
        </nav>
      </div>

      <main>{children}</main>
    </div>
  );
}
