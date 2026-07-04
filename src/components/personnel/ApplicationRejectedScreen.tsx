'use client';

import Link from 'next/link';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { FiRefreshCw, FiXCircle } from 'react-icons/fi';
import { BrandLockup } from '@/components/brand/BrandLockup';

type Props = {
  onNewApplication: () => void;
};

export function ApplicationRejectedScreen({ onNewApplication }: Props) {

  const strings = useRegistryStrings('components/personnel/ApplicationRejectedScreen');
  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-x-hidden">
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-800 via-slate-700 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_55%)]" />
      </div>

      <div className="flex flex-1 flex-col px-4 pt-5 pb-6 safe-pt safe-pb max-w-md mx-auto w-full">
        <BrandLockup
          size="sm"
          className="mb-5"
          iconClassName="ring-2 ring-white/30"
          wordmarkClassName="text-white/95 font-semibold"
        />

        <div className="flex flex-1 flex-col justify-center">
          <div className="rounded-3xl bg-white shadow-2xl shadow-slate-950/25 overflow-hidden text-center">
            <div className="px-6 pt-8 pb-2">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                <FiXCircle className="w-8 h-8" />
              </div>
              <span className="mt-4 inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-800">
                {strings.badge}
              </span>
              <h1 className="mt-3 text-xl font-bold text-slate-900">{strings.title}</h1>
            </div>

            <div className="px-6 pb-8 pt-4">
              <p className="text-sm text-slate-600 leading-relaxed">{strings.description}</p>
              <button
                type="button"
                onClick={onNewApplication}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3.5 text-sm font-semibold text-white hover:bg-slate-800 active:scale-[0.98] transition-all"
              >
                <FiRefreshCw className="w-4 h-4" />
                {strings.newApplicationCta}
              </button>
              <Link
                href="/personnel-panel/login"
                className="mt-3 block py-2 text-xs font-medium text-slate-500 hover:text-slate-700"
              >
                {strings.backToLogin}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
