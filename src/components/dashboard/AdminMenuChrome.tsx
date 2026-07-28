'use client';

import Link from 'next/link';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { FiSliders, FiX } from 'react-icons/fi';
import { BrandMark } from '@/components/brand/BrandMark';
import { ProjectStatusBadge } from '@/components/project/ProjectStatusBadge';
import { LanguageSwitch } from '@/components/i18n/LanguageSwitch';
import { APP_NAME } from '@/lib/brand';
import type { Project } from '@/types/project';

type BrandProps = {
  onNavigate?: () => void;
  onClose?: () => void;
  showClose?: boolean;
};

export function AdminMenuBrandBar({ onNavigate, onClose, showClose }: BrandProps) {
  const strings = useRegistryStrings('components/dashboard/AdminMenuChrome');
  const tagline = strings.tagline;

  return (
    <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-3.5 border-b border-slate-100 bg-white">
      <Link
        href="/admin-panel"
        onClick={onNavigate}
        className="flex items-center gap-2.5 min-w-0 group flex-1"
      >
        <BrandMark size="sm" className="shadow-md shadow-blue-500/20" />
        <div className="min-w-0">
          <p className="font-bold text-slate-900 tracking-tight leading-tight group-hover:text-blue-700 transition-colors">
            {APP_NAME}
          </p>
          <p className="text-[10px] text-slate-500 truncate leading-snug">{tagline}</p>
        </div>
      </Link>
      <LanguageSwitch variant="compact" />
      {showClose && onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          aria-label={strings.closeMenuAriaLabel}
        >
          <FiX className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

type MobileHeaderProps = {
  project?: Project | null;
  projectId?: string | null;
  onClose: () => void;
  onSettings?: () => void;
};

/** Mobil drawer — sadece proje adı, marka tekrarı yok */
export function AdminMobileDrawerHeader({
  project,
  projectId,
  onClose,
  onSettings,
}: MobileHeaderProps) {
  const strings = useRegistryStrings('components/dashboard/AdminMenuChrome');

  return (
    <div className="shrink-0 flex items-center gap-2 px-3 h-14 border-b border-slate-200 bg-white">
      <div className="min-w-0 flex-1">
        {project && projectId ? (
          <>
            <Link
              href={`/admin-panel/proje/${projectId}`}
              onClick={onClose}
              className="block font-semibold text-slate-900 truncate text-[15px] leading-tight"
            >
              {project.name}
            </Link>
            <div className="mt-0.5 flex items-center gap-2 min-w-0">
              <ProjectStatusBadge status={project.status} />
              {project.location && (
                <span className="text-[11px] text-slate-500 truncate">{project.location}</span>
              )}
            </div>
          </>
        ) : (
          <p className="font-semibold text-slate-900">{strings.menuTitle}</p>
        )}
      </div>
      {onSettings && (
        <button
          type="button"
          onClick={onSettings}
          className="shrink-0 flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:bg-slate-100"
          aria-label={strings.projectSettingsAriaLabel}
        >
          <FiSliders className="w-4 h-4" />
        </button>
      )}
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:bg-slate-100"
        aria-label={strings.closeMenuAriaLabel}
      >
        <FiX className="w-5 h-5" />
      </button>
    </div>
  );
}

type ProjectCardProps = {
  project: Project;
  projectId: string;
  onSettings?: () => void;
  onNavigate?: () => void;
};

export function AdminProjectMenuCard({
  project,
  projectId,
  onSettings,
  onNavigate,
}: ProjectCardProps) {
  const strings = useRegistryStrings('components/dashboard/AdminMenuChrome');

  return (
    <div className="relative overflow-hidden rounded-xl border border-blue-100/80 bg-gradient-to-br from-blue-50/90 via-white to-indigo-50/50 shadow-sm">
      <div
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600"
        aria-hidden
      />
      <div className="p-3.5 pt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
              {strings.activeProjectLabel}
            </p>
            <Link
              href={`/admin-panel/proje/${projectId}`}
              onClick={onNavigate}
              className="mt-1 block font-semibold text-slate-900 truncate hover:text-blue-700 transition-colors"
              title={project.name}
            >
              {project.name}
            </Link>
            {project.location && (
              <p className="text-[11px] text-slate-500 truncate mt-0.5">{project.location}</p>
            )}
          </div>
          <ProjectStatusBadge status={project.status} />
        </div>

        {onSettings && (
          <button
            type="button"
            onClick={onSettings}
            className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white/80 border border-slate-200/80 hover:border-blue-200 hover:bg-white hover:text-blue-800 transition-colors"
          >
            <FiSliders className="w-3.5 h-3.5" />
            {strings.projectSettingsButton}
          </button>
        )}
      </div>
    </div>
  );
}
