'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { HonorIconTile } from '@/components/icons/HonorIcons';
import { AdminUiModeToggle } from '@/components/dashboard/AdminUiModeToggle';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { useAdminUiMode } from '@/hooks/useAdminUiMode';
import { getSimpleMenuLinks } from '@/lib/admin-ui-mode';
import { getProjectMenuIconFromHref } from '@/lib/project-menu-icons';
import {
  getProjectMenuGroups,
  getProjectMenuPrimary,
  isMenuPathActive,
} from '@/config/projectMenu';

type Props = {
  projectId: string;
};

export function ProjectNavHub({ projectId }: Props) {
  const strings = useRegistryStrings('components/project/ProjectNavMenu');
  const pathname = usePathname() ?? '';
  const { isSimple } = useAdminUiMode();

  const links = useMemo(() => {
    if (isSimple) return getSimpleMenuLinks(projectId);
    const primary = getProjectMenuPrimary(projectId);
    const groups = getProjectMenuGroups(projectId);
    return [...primary, ...groups.flatMap((g) => g.links)];
  }, [isSimple, projectId]);

  return (
    <div className="mb-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {isSimple ? strings.dailySimple : strings.daily}
        </p>
        <AdminUiModeToggle compact />
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {links.map((link) => {
          const href = link.href(projectId);
          const active = isMenuPathActive(projectId, pathname, href);
          const icon = getProjectMenuIconFromHref(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                active
                  ? 'border-[#0E1548]/20 bg-[#0E1548] text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <HonorIconTile name={icon.name} theme={icon.theme} size="xs" muted={!active} />
              <span className="max-w-[8rem] truncate">{link.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {links.map((link) => {
          const href = link.href(projectId);
          const active = isMenuPathActive(projectId, pathname, href);
          const icon = getProjectMenuIconFromHref(href);
          return (
            <Link
              key={`grid-${href}`}
              href={href}
              className={`flex flex-col items-center gap-2 rounded-2xl border p-3 text-center transition ${
                active
                  ? 'border-[#0E1548]/20 bg-white shadow-md ring-1 ring-[#0E1548]/10'
                  : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <HonorIconTile name={icon.name} theme={icon.theme} size="md" muted={!active} />
              <span
                className={`text-[11px] font-semibold leading-tight ${
                  active ? 'text-[#0E1548]' : 'text-slate-600'
                }`}
              >
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
