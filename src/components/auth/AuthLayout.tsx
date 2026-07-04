'use client';

import Link from 'next/link';
import { AuthScreenShell } from '@/components/auth/AuthScreenShell';
import { personnelAuthCardClass } from '@/lib/personnel-auth-ui';
import strings from '@json/src/components/auth/AuthLayout.json';

type AuthLayoutProps = {
  variant: 'admin' | 'personnel';
  children: React.ReactNode;
  alternateLogin?: { href: string; label: string };
};

export function AuthLayout({ variant, children, alternateLogin }: AuthLayoutProps) {
  const panelLabel =
    variant === 'admin' ? strings.adminPanelLabel : strings.personnelPanelLabel;
  const screenLabel =
    variant === 'admin' ? strings.adminScreenLabel : strings.personnelScreenLabel;

  return (
    <AuthScreenShell screenLabel={screenLabel} panelLabel={panelLabel}>
      <div className="flex-1 flex items-center justify-center px-4 py-4 sm:px-6 sm:py-8 safe-pb">
        <div className="w-full max-w-md">
          <div className={`${personnelAuthCardClass} p-6 sm:p-7`}>{children}</div>

          {alternateLogin && (
            <p className="mt-5 text-center text-sm text-slate-300 px-2 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
              {variant === 'admin' ? strings.adminAlternatePrompt : strings.personnelAlternatePrompt}{' '}
              <Link
                href={alternateLogin.href}
                className="text-sky-400 font-semibold hover:text-sky-300 hover:underline touch-target inline-flex py-1"
              >
                {alternateLogin.label}
              </Link>
            </p>
          )}

          <p className="mt-3 text-center">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-white transition-colors drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]"
            >
              {strings.homeLink}
            </Link>
          </p>
        </div>
      </div>
    </AuthScreenShell>
  );
}
