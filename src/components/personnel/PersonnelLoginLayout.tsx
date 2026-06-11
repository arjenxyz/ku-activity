'use client';

import Link from 'next/link';

type PersonnelLoginLayoutProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
};

export function PersonnelLoginLayout({
  children,
  title = 'Giriş yapın',
  subtitle = 'Kayıtlı e-posta ve şifreniz ile hesabınıza erişin',
}: PersonnelLoginLayoutProps) {
  return (
    <div className="min-h-[100dvh] relative flex flex-col">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-400/10 dark:bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-400/10 dark:bg-indigo-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
      </div>

      <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-6 safe-pt safe-px">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 group-hover:text-blue-600 transition-colors">
            Ana sayfa
          </span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6 safe-pb">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-sm font-medium mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
              </span>
              Personel Paneli
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-black/30 border border-gray-100 dark:border-slate-700 p-5 sm:p-7">
            {children}
          </div>

          <p className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">
            Yönetici misiniz?{' '}
            <Link
              href="/admin-panel/login"
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              Yönetici Girişi
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
