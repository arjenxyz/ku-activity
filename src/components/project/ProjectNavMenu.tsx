'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import { getProjectMenuGroups } from '@/config/projectMenu';

export function ProjectNavLinks({
  projectId,
  onNavigate,
}: {
  projectId: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const groups = getProjectMenuGroups(projectId);
  const [openId, setOpenId] = useState<string | null>(() => {
    const active = groups.find((g) =>
      g.links.some(
        (l) =>
          pathname === l.href(projectId) || pathname.startsWith(l.href(projectId) + '/')
      )
    );
    return active?.id ?? 'personel';
  });

  const isLinkActive = (href: string) =>
    pathname === href ||
    (href !== `/admin-panel/proje/${projectId}` && pathname.startsWith(href));

  return (
    <nav className="space-y-1">
      {groups.map((group) => {
        const expanded = openId === group.id;
        const groupActive = group.links.some((l) => isLinkActive(l.href(projectId)));

        return (
          <div key={group.id} className="border border-slate-200 rounded-lg overflow-hidden bg-white">
            <button
              type="button"
              onClick={() => setOpenId(expanded ? null : group.id)}
              className={`w-full flex items-center justify-between px-4 py-3 text-left text-sm font-semibold transition-colors ${
                groupActive ? 'bg-slate-50 text-slate-900' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {group.label}
              <FiChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
              />
            </button>
            {expanded && (
              <ul className="border-t border-slate-100 py-1">
                {group.links.map((link) => {
                  const href = link.href(projectId);
                  const active = isLinkActive(href);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={onNavigate}
                        className={`block px-4 py-2.5 text-sm transition-colors ${
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
    </nav>
  );
}

export function ProjectNavMenu({ projectId }: { projectId: string }) {
  return (
    <aside className="hidden lg:block w-56 xl:w-64 shrink-0">
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1">
        Proje Menüsü
      </p>
      <ProjectNavLinks projectId={projectId} />
    </aside>
  );
}
