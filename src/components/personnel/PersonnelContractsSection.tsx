'use client';

import { useEffect, useState } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { useRouter } from 'next/navigation';
import { FiChevronRight, FiFileText } from 'react-icons/fi';
import { formatDate } from '@/lib/format';
import { formatString } from '@/lib/strings/format';

type ContractRow = {
  slug: string;
  title: string;
  summary?: string | null;
  version: number;
  acceptedAt: string;
  accessToken: string;
  contentHash?: string | null;
};

type Props = {
  variant?: 'default' | 'compact';
};

export function PersonnelContractsSection({ variant = 'default' }: Props) {
  const strings = useRegistryStrings('components/personnel/PersonnelContractsSection');
  const router = useRouter();
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/personnel/contracts')
      .then((r) => (r.ok ? r.json() : { contracts: [] }))
      .then((d) => setContracts(d.contracts ?? []))
      .finally(() => setLoading(false));
  }, []);

  const sectionTitle =
    contracts.length > 0
      ? formatString(strings.sectionTitleWithCount, { count: contracts.length })
      : strings.sectionTitle;

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-5 dark:border-slate-700 dark:bg-slate-800">
        <div className="h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-3 h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-700/60" />
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <section
        aria-labelledby="personnel-contracts-title"
        className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"
      >
        <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-3.5 dark:border-slate-700">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <FiFileText className="h-4 w-4" aria-hidden />
          </span>
          <h3 id="personnel-contracts-title" className="text-sm font-semibold text-slate-900 dark:text-white">
            {sectionTitle}
          </h3>
        </div>
        {contracts.length === 0 ? (
          <p className="px-4 py-4 text-sm text-slate-500">{strings.empty}</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-700/80">
            {contracts.map((contract) => (
              <li key={contract.slug}>
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/sozlesme/${contract.slug}?t=${encodeURIComponent(contract.accessToken)}&from=personnel`
                    )
                  }
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/80"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                      {contract.title}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {formatString(strings.versionLine, {
                        version: contract.version,
                        date: formatDate(contract.acceptedAt.slice(0, 10)),
                      })}
                    </p>
                  </div>
                  <FiChevronRight className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  if (!contracts.length) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-700/80">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
            <FiFileText className="h-4 w-4 text-blue-600" aria-hidden />
            {strings.sectionTitle}
          </p>
        </div>
        <p className="px-4 py-4 text-sm text-slate-500">{strings.empty}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-700/80">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
          <FiFileText className="h-4 w-4 text-blue-600" aria-hidden />
          {sectionTitle}
        </p>
      </div>
      <ul className="divide-y divide-slate-100 dark:divide-slate-700/80">
        {contracts.map((contract) => (
          <li key={contract.slug} className="px-4 py-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{contract.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {formatString(strings.versionLine, {
                    version: contract.version,
                    date: formatDate(contract.acceptedAt.slice(0, 10)),
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/sozlesme/${contract.slug}?t=${encodeURIComponent(contract.accessToken)}&from=personnel`
                  )
                }
                className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-100 dark:bg-blue-950/40"
              >
                {strings.open}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
