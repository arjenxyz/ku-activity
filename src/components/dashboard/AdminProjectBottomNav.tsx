'use client';

import Link from 'next/link';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { usePathname } from 'next/navigation';
import { HonorIconTile } from '@/components/icons/HonorIcons';
import { useAdminUiMode } from '@/hooks/useAdminUiMode';
import { getSimpleMenuLinks } from '@/lib/admin-ui-mode';
import { getProjectMenuIconFromHref } from '@/lib/project-menu-icons';
import { isMenuPathActive } from '@/config/projectMenu';

type Props = {
  projectId: string;
};

export function AdminProjectBottomNav({ projectId }: Props) {
  const strings = useRegistryStrings('components/dashboard/AdminProjectBottomNav');
  const pathname = usePathname();
  const { isSimple } = useAdminUiMode();

  const links = isSimple
    ? getSimpleMenuLinks(projectId)
    : [
        { label: strings.attendance, href: () => `/admin-panel/proje/${projectId}/yevmiye` },
        { label: strings.advance, href: () => `/admin-panel/proje/${projectId}/avans` },
        { label: strings.summary, href: () => `/admin-panel/proje/${projectId}` },
      ];

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 sm:hidden border-t border-slate-200 bg-white/95 backdrop-blur-lg safe-pb"
      aria-label={strings.navAriaLabel}
    >
      <div className="flex items-end max-w-lg mx-auto">
        {links.map((link) => {
          const href = link.href(projectId);
          const active = isMenuPathActive(projectId, pathname, href);
          const isYoklama = href.includes('/yevmiye');
          const icon = getProjectMenuIconFromHref(href);

          if (isYoklama) {
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center flex-1 -mt-3 pb-1 touch-target"
              >
                <span className="relative">
                  <HonorIconTile
                    name="qr"
                    theme="emerald"
                    size="xl"
                    className={active ? 'ring-2 ring-emerald-300 ring-offset-2' : ''}
                  />
                </span>
                <span
                  className={`mt-1 text-[10px] font-semibold ${active ? 'text-emerald-700' : 'text-slate-600'}`}
                >
                  {strings.attendance}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 min-h-[52px] flex-1 text-[10px] font-medium touch-target ${
                active ? 'text-blue-600' : 'text-slate-500'
              }`}
            >
              {active ? (
                <HonorIconTile name={icon.name} theme={icon.theme} size="sm" />
              ) : (
                <HonorIconTile name={icon.name} theme={icon.theme} size="sm" muted className="opacity-70" />
              )}
              <span>{link.label.replace('Personel ', '').replace('Yoklama QR', strings.attendance)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
