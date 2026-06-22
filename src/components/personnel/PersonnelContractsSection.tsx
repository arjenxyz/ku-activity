'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiDownload, FiFileText, FiShield } from 'react-icons/fi';
import { formatDate } from '@/lib/format';

type ContractRow = {
  slug: string;
  title: string;
  summary?: string | null;
  version: number;
  acceptedAt: string;
  accessToken: string;
  contentHash?: string | null;
};

export function PersonnelContractsSection() {
  const router = useRouter();
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/personnel/contracts')
      .then((r) => (r.ok ? r.json() : { contracts: [] }))
      .then((d) => setContracts(d.contracts ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
        <p className="text-sm text-slate-500">Sözleşmeler yükleniyor…</p>
      </div>
    );
  }

  if (!contracts.length) {
    return (
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/50">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
            <FiFileText className="w-4 h-4 text-blue-600" />
            Sözleşmelerim
          </p>
        </div>
        <p className="px-4 py-4 text-sm text-slate-500">Onayladığınız sözleşme bulunmuyor.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/50">
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
          <FiFileText className="w-4 h-4 text-blue-600" />
          Sözleşmelerim{contracts.length > 0 ? ` (${contracts.length})` : ''}
        </p>
      </div>
      <ul className="divide-y divide-slate-100 dark:divide-slate-700/80">
        {contracts.map((c) => (
          <li key={c.slug} className="px-4 py-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{c.title}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Sürüm {c.version} · {formatDate(c.acceptedAt.slice(0, 10))}
                </p>
                {c.contentHash && (
                  <p
                    className="text-[10px] text-slate-400 font-mono mt-1 flex items-center gap-1 truncate"
                    title={c.contentHash}
                  >
                    <FiShield className="w-3 h-3 shrink-0" />
                    {c.contentHash.slice(0, 12)}…
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/sozlesme/${c.slug}?t=${encodeURIComponent(c.accessToken)}&from=personnel`
                  )
                }
                className="shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 transition-colors"
              >
                <FiDownload className="w-3.5 h-3.5" />
                Aç
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
