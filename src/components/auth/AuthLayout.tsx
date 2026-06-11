'use client';

import Link from 'next/link';

type AuthLayoutProps = {
  variant: 'admin' | 'personnel';
  children: React.ReactNode;
  alternateLogin?: { href: string; label: string };
};

export function AuthLayout({ variant, children, alternateLogin }: AuthLayoutProps) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-gray-50">
      <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-6 safe-pt safe-px">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors touch-target py-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Ana sayfa
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-6 sm:px-6 sm:py-10 safe-pb">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-5 sm:p-7 lg:p-8">
            {children}
          </div>

          {alternateLogin && (
            <p className="mt-5 text-center text-sm text-gray-500 px-2">
              {variant === 'admin' ? 'Personel misiniz?' : 'Yönetici misiniz?'}{' '}
              <Link
                href={alternateLogin.href}
                className="text-blue-600 font-semibold hover:underline touch-target inline-flex py-1"
              >
                {alternateLogin.label}
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
