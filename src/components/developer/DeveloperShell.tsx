'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiLogOut } from 'react-icons/fi';
import strings from '@json/src/components/developer/DeveloperShell.json';

const navItems = [
  { href: '/developer-panel', label: strings.nav.codes, match: (path: string) => path === '/developer-panel' },
  {
    href: '/developer-panel/releases',
    label: strings.nav.releases,
    match: (path: string) => path.startsWith('/developer-panel/releases'),
  },
];

export function DeveloperShell({
  children,
  onLogout,
}: {
  children: React.ReactNode;
  onLogout: () => void;
}) {
  const pathname = usePathname();
  const subtitle = pathname.startsWith('/developer-panel/releases')
    ? strings.subtitle.releases
    : strings.subtitle.codes;

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              D
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{strings.panelTitle}</p>
              <p className="text-[10px] text-slate-400 truncate">{subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 text-sm text-slate-300 hover:bg-slate-800 shrink-0"
          >
            <FiLogOut className="w-4 h-4" />
            {strings.logout}
          </button>
        </div>
        <nav className="max-w-5xl mx-auto px-4 sm:px-6 pb-3 flex gap-2 overflow-x-auto">
          {navItems.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-violet-600/20 text-violet-200 border border-violet-700/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">{children}</main>
      <footer className="max-w-5xl mx-auto px-4 pb-8 text-center text-xs text-slate-500">
        <Link href="/" className="hover:text-slate-300">
          {strings.backHome}
        </Link>
      </footer>
    </div>
  );
}
