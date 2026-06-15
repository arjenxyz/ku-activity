'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { FiGrid, FiLogOut, FiSettings, FiSliders } from 'react-icons/fi';
import { ProjectNavLinks } from '@/components/project/ProjectNavMenu';
import { ProjectSettingsModal } from '@/components/modals/ProjectSettingsModal';
import { ProjectStatusBadge } from '@/components/project/ProjectStatusBadge';
import { BrandMark } from '@/components/brand/BrandMark';
import { APP_NAME } from '@/lib/brand';
import { useAdminCurrentProject } from '@/hooks/useAdminCurrentProject';

const PROJECT_ID_RE = /^\/admin-panel\/proje\/([a-f0-9-]{36})/;

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const projectId = useMemo(() => pathname.match(PROJECT_ID_RE)?.[1] ?? null, [pathname]);
  const { project, setProject } = useAdminCurrentProject(projectId);
  const isProjectsHome = pathname === '/admin-panel';
  const isGlobalWagePolicy = pathname === '/admin-panel/maas-politikasi';

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center min-w-0 gap-2 sm:gap-2.5">
            <Link
              href="/admin-panel"
              className="flex items-center gap-2 shrink-0 rounded-lg hover:opacity-90 transition-opacity"
            >
              <BrandMark size="sm" className="w-8 h-8 rounded-lg" />
              <span className="font-semibold text-slate-900 hidden sm:inline">{APP_NAME}</span>
            </Link>

            {projectId && project && (
              <>
                <span
                  className="hidden sm:block text-slate-300 font-light select-none"
                  aria-hidden
                >
                  /
                </span>
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <Link
                    href={`/admin-panel/proje/${projectId}`}
                    className="min-w-0 flex items-center gap-2 rounded-lg px-1 sm:px-0 py-1 hover:bg-slate-50 transition-colors"
                    title={project.name}
                  >
                    <span className="font-medium text-slate-800 truncate max-w-[120px] sm:max-w-[200px] lg:max-w-xs text-sm sm:text-base">
                      {project.name}
                    </span>
                    <span className="hidden md:inline-flex shrink-0">
                      <ProjectStatusBadge status={project.status} />
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setSettingsOpen(true)}
                    className="hidden sm:flex shrink-0 items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                    title="Proje ayarları"
                    aria-label="Proje ayarları"
                  >
                    <FiSliders className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}

            {projectId && !project && (
              <span className="hidden sm:inline text-sm text-slate-400 truncate">Yükleniyor…</span>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-1 shrink-0">
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
            <Link
              href="/admin-panel/maas-politikasi"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isGlobalWagePolicy
                  ? 'text-blue-700 bg-blue-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FiSettings className="w-4 h-4" />
              Maaş Politikası
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

          <button
            type="button"
            className="sm:hidden flex flex-col justify-center items-center w-10 h-10 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
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
            {project && projectId && (
              <div className="mb-4 px-2 py-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Aktif proje
                </p>
                <p className="font-semibold text-slate-900 truncate">{project.name}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <ProjectStatusBadge status={project.status} />
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsOpen(true);
                      closeMenu();
                    }}
                    className="text-xs font-medium text-slate-600 hover:text-slate-900"
                  >
                    Proje ayarları
                  </button>
                </div>
              </div>
            )}

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

      {project && (
        <ProjectSettingsModal
          project={project}
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onUpdate={(updated) => setProject(updated)}
          onDelete={() => {
            setSettingsOpen(false);
            router.replace('/admin-panel');
          }}
        />
      )}

      <main>{children}</main>
    </div>
  );
}
