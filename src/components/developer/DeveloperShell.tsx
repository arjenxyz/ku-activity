'use client';

import Link from 'next/link';
import { FiLogOut } from 'react-icons/fi';

export function DeveloperShell({
  children,
  onLogout,
}: {
  children: React.ReactNode;
  onLogout: () => void;
}) {
  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              D
            </div>
            <div>
              <p className="text-sm font-semibold">Developer Panel</p>
              <p className="text-[10px] text-slate-400">Doğrulama kodları</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 text-sm text-slate-300 hover:bg-slate-800"
          >
            <FiLogOut className="w-4 h-4" />
            Çıkış
          </button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">{children}</main>
      <footer className="max-w-5xl mx-auto px-4 pb-8 text-center text-xs text-slate-500">
        <Link href="/" className="hover:text-slate-300">
          Ana sayfaya dön
        </Link>
      </footer>
    </div>
  );
}
