'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import {
  FiBriefcase,
  FiChevronDown,
  FiClock,
  FiDollarSign,
  FiDownload,
  FiMail,
  FiShield,
} from 'react-icons/fi';
import { DEFAULT_SUPPORT_EMAIL } from '@/lib/brand';
import { PersonnelContractsSection } from './PersonnelContractsSection';

function parseFilename(contentDisposition: string | null, fallback: string) {
  if (!contentDisposition) return fallback;
  const match = /filename="([^"]+)"/i.exec(contentDisposition);
  return match?.[1] ?? fallback;
}

type QuickLinkId = 'finance' | 'work' | 'mesai' | 'asgari';

type QuickLink = {
  id: QuickLinkId;
  tab: string;
  icon: typeof FiDollarSign;
  accent: string;
};

const QUICK_LINKS: QuickLink[] = [
  { id: 'finance', tab: 'finance', icon: FiDollarSign, accent: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
  { id: 'work', tab: 'work', icon: FiBriefcase, accent: 'bg-blue-500/15 text-blue-600 dark:text-blue-400' },
  { id: 'mesai', tab: 'mesai', icon: FiClock, accent: 'bg-orange-500/15 text-orange-600 dark:text-orange-400' },
  { id: 'asgari', tab: 'asgari', icon: FiShield, accent: 'bg-violet-500/15 text-violet-600 dark:text-violet-400' },
];

export function PersonnelRightsPanel() {
  const strings = useRegistryStrings('components/personnel/PersonnelRightsPanel');
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || DEFAULT_SUPPORT_EMAIL;
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError(null);
    try {
      const res = await fetch('/api/personnel/my-dossier');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || strings.errors.downloadFailed);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = parseFilename(res.headers.get('Content-Disposition'), strings.fallbackFilename);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : strings.errors.generic);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-xl shadow-[#0E1548]/20 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0E1548] via-[#152060] to-indigo-900" />
        <div
          className="absolute inset-0 opacity-25 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 90% 10%, rgba(96,165,250,0.45) 0%, transparent 42%)',
          }}
        />
        <div className="relative px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
              <FiShield className="h-6 w-6 text-white" aria-hidden />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <h2 className="text-xl font-bold text-white tracking-tight">{strings.heroTitle}</h2>
              <p className="mt-1 text-sm text-blue-100/90">{strings.heroSubtitle}</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => void handleDownload()}
              disabled={downloading}
              className="flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-3 text-sm font-semibold text-[#0E1548] shadow-sm transition hover:bg-blue-50 disabled:opacity-60"
            >
              {downloading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0E1548]/30 border-t-[#0E1548]" />
              ) : (
                <FiDownload className="h-4 w-4 shrink-0" aria-hidden />
              )}
              <span className="truncate">{downloading ? strings.preparing : strings.downloadCta}</span>
            </button>
            <a
              href={`mailto:${supportEmail}?subject=${encodeURIComponent(strings.mailSubject)}`}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-3 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/15"
            >
              <FiMail className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate">{strings.contactCta}</span>
            </a>
          </div>
          {downloadError ? (
            <p className="mt-2 text-center text-xs text-red-200">{downloadError}</p>
          ) : null}
        </div>
      </section>

      <section aria-labelledby="rights-quick-links">
        <p
          id="rights-quick-links"
          className="mb-2.5 px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400"
        >
          {strings.quickLinksTitle}
        </p>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {QUICK_LINKS.map(({ id, tab, icon: Icon, accent }) => (
            <Link
              key={id}
              href={`/personnel-panel?tab=${tab}`}
              className="group flex flex-col items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white px-3 py-4 shadow-sm transition hover:border-blue-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-800"
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-xl transition group-hover:scale-105 ${accent}`}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="text-center text-xs font-semibold text-slate-800 dark:text-slate-100">
                {strings.quickLinks[id]}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <PersonnelContractsSection variant="compact" />

      <details className="group rounded-2xl border border-slate-200/80 bg-white shadow-sm open:shadow-md dark:border-slate-700 dark:bg-slate-800">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 sm:px-5 [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2.5 text-sm font-semibold text-slate-900 dark:text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <FiShield className="h-4 w-4" aria-hidden />
            </span>
            {strings.kvkkTitle}
          </span>
          <FiChevronDown
            className="h-5 w-5 shrink-0 text-slate-400 transition group-open:rotate-180"
            aria-hidden
          />
        </summary>
        <ul className="space-y-2 border-t border-slate-100 px-4 py-3 sm:px-5 dark:border-slate-700">
          {strings.kvkkRights.map((right) => (
            <li
              key={right}
              className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300"
            >
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" aria-hidden />
              {right}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
