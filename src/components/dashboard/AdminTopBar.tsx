'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiLogOut, FiMenu, FiSliders } from 'react-icons/fi';
import { BrandMark } from '@/components/brand/BrandMark';
import { ProjectStatusBadge } from '@/components/project/ProjectStatusBadge';
import { AdminUiModeToggle } from '@/components/dashboard/AdminUiModeToggle';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { useAdminCurrentProject } from '@/hooks/useAdminCurrentProject';
import { useAdminUiMode } from '@/hooks/useAdminUiMode';
import {
  adminHref,
  getAdminPanelBase,
  isAdminDemoPath,
} from '@/lib/demo/demo-paths';

const PROJECT_ID_RE = /^\/admin-panel(?:\/demo)?\/proje\/([a-zA-Z0-9_-]+)/;

type Props = {
  onLogout: () => void;
  onOpenMenu?: () => void;
  onProjectSettings?: () => void;
};

export function AdminTopBar({ onLogout, onOpenMenu, onProjectSettings }: Props) {
  const strings = useRegistryStrings('components/dashboard/AdminTopBar');
  const pathname = usePathname() ?? '';
  const projectId = pathname.match(PROJECT_ID_RE)?.[1] ?? null;
  const { project } = useAdminCurrentProject(projectId);
  const { isAdvanced } = useAdminUiMode();

  return (
    <header className="sticky top-0 z-[var(--personnel-topbar-z,40)] bg-transparent">
      <div className="safe-pt px-3 pb-2">
        <div className="mx-auto max-w-5xl">
          <div className="flex h-14 items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white/95 px-3 shadow-md shadow-slate-900/[0.06] backdrop-blur-xl sm:px-4">
            <Link
              href={adminHref(pathname, '/admin-panel')}
              className="flex min-w-0 flex-1 items-center gap-2.5 transition-opacity hover:opacity-90 active:opacity-80"
              aria-label={strings.exitAriaLabel}
            >
              <BrandMark size="sm" className="shrink-0 ring-2 ring-[#0E1548]/10 shadow-md" />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-bold tracking-[0.08em] leading-tight text-[#0E1548]">
                  CREWLEDGER
                </p>
                <p className="truncate text-[10px] font-medium leading-tight text-slate-500">
                  {project?.name ?? (isAdminDemoPath(pathname) ? 'Admin demo' : strings.tagline)}
                </p>
              </div>
            </Link>

            {projectId && project && (
              <div className="hidden sm:flex min-w-0 items-center gap-2">
                <Link
                  href={adminHref(pathname, `/admin-panel/proje/${projectId}`)}
                  className="min-w-0 truncate text-sm font-medium text-slate-800 hover:text-[#0E1548]"
                  title={project.name}
                >
                  {project.name}
                </Link>
                <ProjectStatusBadge status={project.status} />
                {isAdvanced && onProjectSettings ? (
                  <button
                    type="button"
                    onClick={onProjectSettings}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-[#0E1548]"
                    title={strings.projectSettingsTitle}
                    aria-label={strings.projectSettingsAriaLabel}
                  >
                    <FiSliders className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            )}

            <div className="flex shrink-0 items-center gap-1.5">
              <div className="hidden sm:block">
                <AdminUiModeToggle compact />
              </div>
              {onOpenMenu ? (
                <button
                  type="button"
                  onClick={onOpenMenu}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl px-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-[#0E1548] sm:px-3"
                  aria-label={strings.menuAriaLabel}
                  aria-haspopup="dialog"
                >
                  <FiMenu className="h-4 w-4" />
                  <span className="hidden sm:inline">{strings.menu}</span>
                </button>
              ) : null}
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl px-2.5 text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600 sm:px-3"
              >
                <FiLogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{strings.logout}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
