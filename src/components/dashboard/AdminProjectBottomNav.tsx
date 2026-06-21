'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiAlertCircle, FiCreditCard, FiHome, FiMaximize2 } from 'react-icons/fi';
import { useAdminUiMode } from '@/hooks/useAdminUiMode';
import { getSimpleMenuLinks } from '@/lib/admin-ui-mode';
import { isMenuPathActive } from '@/config/projectMenu';

type Props = {
  projectId: string;
};

export function AdminProjectBottomNav({ projectId }: Props) {
  const pathname = usePathname();
  const { isSimple } = useAdminUiMode();

  const links = isSimple
    ? getSimpleMenuLinks(projectId)
    : [
        { label: 'Yoklama', href: () => `/admin-panel/proje/${projectId}/yevmiye` },
        { label: 'Avans', href: () => `/admin-panel/proje/${projectId}/avans` },
        { label: 'Özet', href: () => `/admin-panel/proje/${projectId}` },
      ];

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 sm:hidden border-t border-slate-200 bg-white/95 backdrop-blur-lg safe-pb"
      aria-label="Proje mobil menü"
    >
      <div className="flex items-end max-w-lg mx-auto">
        {links.map((link) => {
          const href = link.href(projectId);
          const active = isMenuPathActive(projectId, pathname, href);
          const isYoklama = href.includes('/yevmiye');

          if (isYoklama) {
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center flex-1 -mt-3 pb-1 touch-target"
              >
                <span
                  className={`flex items-center justify-center w-14 h-14 rounded-2xl shadow-lg transition-colors ${
                    active
                      ? 'bg-emerald-600 text-white shadow-emerald-500/40 ring-2 ring-emerald-300'
                      : 'bg-emerald-600 text-white shadow-emerald-500/30 active:bg-emerald-700'
                  }`}
                >
                  <FiMaximize2 className="w-6 h-6" strokeWidth={2.25} />
                </span>
                <span
                  className={`mt-1 text-[10px] font-semibold ${active ? 'text-emerald-700' : 'text-slate-600'}`}
                >
                  Yoklama
                </span>
              </Link>
            );
          }

          const Icon = href.includes('/avans')
            ? FiCreditCard
            : href.includes('/itirazlar')
              ? FiAlertCircle
              : FiHome;

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 py-2.5 min-h-[52px] flex-1 text-[10px] font-medium touch-target ${
                active ? 'text-blue-600' : 'text-slate-500'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{link.label.replace('Personel ', '').replace('Yoklama QR', 'Yoklama')}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
