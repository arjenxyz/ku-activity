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
        <div className="absolute inset-0 bg-[#e7eef8]" />
        <div className="absolute -top-24 left-1/3 h-72 w-72 rounded-full bg-slate-300/50 blur-3xl" />
      </div>

      <div className="flex flex-1 flex-col px-4 pt-5 pb-6 safe-pt safe-pb max-w-md mx-auto w-full">
        <BrandLockup
          size="sm"
          className="mb-5"
          iconClassName="ring-1 ring-slate-200"
          wordmarkClassName="font-semibold text-[#0E1548]"
        />

        <div className="flex flex-1 flex-col justify-center">
          <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white text-center shadow-[0_24px_60px_-28px_rgba(14,21,72,0.35)]">
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
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0E1548] py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#152060]"
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
