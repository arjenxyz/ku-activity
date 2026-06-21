'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import { AdminMenuBrandBar, AdminProjectMenuCard } from '@/components/dashboard/AdminMenuChrome';
import { AdminUiModeToggle } from '@/components/dashboard/AdminUiModeToggle';
import { useAdminCurrentProject } from '@/hooks/useAdminCurrentProject';
import { useAdminProjectSettings } from '@/hooks/useAdminProjectSettings';
import { useAdminUiMode } from '@/hooks/useAdminUiMode';
import { getSimpleMenuLinks } from '@/lib/admin-ui-mode';
import {
  findActiveMenuGroupId,
  getProjectMenuGroups,
  getProjectMenuPrimary,
  isMenuPathActive,
} from '@/config/projectMenu';

type NavVariant = 'sidebar' | 'mobile';

function linkClass(active: boolean, mobile: boolean) {
  if (mobile) {
    return active
      ? 'bg-blue-600 text-white font-medium'
      : 'text-slate-800 active:bg-slate-100';
  }
  return active
    ? 'bg-blue-600 text-white shadow-sm'
    : 'text-slate-700 hover:bg-slate-100';
}

export function ProjectNavLinks({
  projectId,
  onNavigate,
  variant = 'sidebar',
}: {
  projectId: string;
  onNavigate?: () => void;
  variant?: NavVariant;
}) {
  const pathname = usePathname();
  const mobile = variant === 'mobile';
  const { isSimple } = useAdminUiMode();
  const primary = isSimple ? getSimpleMenuLinks(projectId) : getProjectMenuPrimary(projectId);
  const groups = isSimple ? [] : getProjectMenuGroups(projectId);
  const [openId, setOpenId] = useState<string | null>(() =>
    isSimple ? null : findActiveMenuGroupId(projectId, pathname)
  );

  useEffect(() => {
    if (isSimple) {
      setOpenId(null);
      return;
    }
    setOpenId(findActiveMenuGroupId(projectId, pathname));
  }, [projectId, pathname, isSimple]);

  return (
    <nav className={mobile ? 'space-y-1' : 'space-y-4'}>
      <div>
        {!mobile && (
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 px-1">
            {isSimple ? 'Günlük işlemler' : 'Günlük'}
          </p>
        )}
        <ul className="space-y-0.5">
          {primary.map((link) => {
          const href = link.href(projectId);
          const active = isMenuPathActive(projectId, pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                className={`block rounded-lg transition-colors ${
                  mobile ? 'px-3 py-2.5 text-[15px]' : 'px-3 py-2.5'
                } ${linkClass(active, mobile)}`}
              >
                <span className={mobile ? 'font-medium' : 'text-sm font-semibold'}>
                  {link.label}
                </span>
                {!mobile && link.hint && (
                  <span
                    className={`block text-[11px] mt-0.5 ${
                      active ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    {link.hint}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
        </ul>
      </div>

      {groups.length > 0 && (
        <div className={mobile ? 'pt-2 mt-2 border-t border-slate-200/80' : ''}>
          {!mobile && (
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 px-1">
              Menü
            </p>
          )}
          <div className={mobile ? 'divide-y divide-slate-100' : 'space-y-1'}>
            {groups.map((group) => {
              const expanded = openId === group.id;
              const groupActive =
                group.id === 'kontrol' &&
                (pathname.includes('/sorgulama') || pathname.includes('/kayit-gecmisi'))
                  ? true
                  : group.links.some((l) =>
                      isMenuPathActive(projectId, pathname, l.href(projectId))
                    );

              if (mobile) {
                return (
                  <div key={group.id}>
                    <button
                      type="button"
                      onClick={() => setOpenId(expanded ? null : group.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-left text-[15px] font-medium ${
                        groupActive ? 'text-blue-700' : 'text-slate-700'
                      }`}
                    >
                      {group.label}
                      <FiChevronDown
                        className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                          expanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {expanded && (
                      <ul className="pb-1">
                        {group.links.map((link) => {
                          const href = link.href(projectId);
                          const active =
                            link.label === 'Kayıt geçmişi'
                              ? pathname.includes('/kayit-gecmisi') ||
                                pathname.includes('/sorgulama')
                              : isMenuPathActive(projectId, pathname, href);
                          return (
                            <li key={href}>
                              <Link
                                href={href}
                                onClick={onNavigate}
                                className={`block pl-5 pr-3 py-2 text-sm rounded-lg mx-1 ${
                                  active
                                    ? 'bg-blue-50 text-blue-800 font-medium'
                                    : 'text-slate-600 active:bg-slate-50'
                                }`}
                              >
                                {link.label}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              }

              return (
                <div
                  key={group.id}
                  className="border border-slate-200/80 rounded-lg overflow-hidden bg-white"
                >
                  <button
                    type="button"
                    onClick={() => setOpenId(expanded ? null : group.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                      groupActive
                        ? 'bg-slate-50 text-slate-900'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {group.label}
                    <FiChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                        expanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {expanded && (
                    <ul className="border-t border-slate-100 py-1">
                      {group.links.map((link) => {
                        const href = link.href(projectId);
                        const active =
                          link.label === 'Kayıt geçmişi'
                            ? pathname.includes('/kayit-gecmisi') ||
                              pathname.includes('/sorgulama')
                            : isMenuPathActive(projectId, pathname, href);
                        return (
                          <li key={href}>
                            <Link
                              href={href}
                              onClick={onNavigate}
                              className={`block px-3 py-2 text-sm transition-colors ${
                                active
                                  ? 'bg-blue-50 text-blue-800 font-medium border-l-2 border-blue-600'
                                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                              }`}
                            >
                              {link.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!mobile && (
        <div className="pt-1 border-t border-slate-100">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
            Arayüz
          </p>
          <AdminUiModeToggle className="w-full flex" />
          {isSimple && (
            <p className="text-[10px] text-slate-500 mt-2 px-1 leading-relaxed">
              Gelişmiş mod: taşeron kârı, bloklar, bordro ve arşiv.
            </p>
          )}
        </div>
      )}
    </nav>
  );
}

export function ProjectNavMenu({ projectId }: { projectId: string }) {
  const { project } = useAdminCurrentProject(projectId);
  const settingsCtx = useAdminProjectSettings();
  const { isAdvanced } = useAdminUiMode();

  return (
    <aside className="hidden lg:flex lg:flex-col w-56 xl:w-60 shrink-0 sticky top-20 self-start max-h-[calc(100vh-6rem)]">
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden flex flex-col max-h-full">
        <AdminMenuBrandBar />
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {project && (
            <AdminProjectMenuCard
              project={project}
              projectId={projectId}
              onSettings={
                isAdvanced && settingsCtx
                  ? () => settingsCtx.openProjectSettings()
                  : undefined
              }
            />
          )}
          <ProjectNavLinks projectId={projectId} />
        </div>
      </div>
    </aside>
  );
}
