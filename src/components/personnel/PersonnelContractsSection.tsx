'use client';

import { useEffect, useState } from 'react';
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
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/personnel/contracts')
      .then((r) => (r.ok ? r.json() : { contracts: [] }))
      .then((d) => setContracts(d.contracts ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-sm text-slate-500">Sözleşmeler yükleniyor…</p>;
  }

  if (!contracts.length) {
    return (
      <div className="rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-6">
        <p className="text-sm text-gray-500">Kayıtlı sözleşme onayınız bulunmuyor.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-4 sm:p-6 space-y-3">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
        <FiFileText className="w-4 h-4" />
        Sözleşmelerim ({contracts.length})
      </p>
      <ul className="space-y-3">
        {contracts.map((c) => (
          <li
            key={c.slug}
            className="rounded-xl border border-slate-200 dark:border-slate-600 px-4 py-3 space-y-2"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{c.title}</p>
                {c.summary && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {c.summary}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1.5">
                  Sürüm {c.version} · Onay: {formatDate(c.acceptedAt.slice(0, 10))}
                </p>
                {c.contentHash && (
                  <p
                    className="text-[10px] text-slate-400 font-mono mt-1 truncate flex items-center gap-1"
                    title={c.contentHash}
                  >
                    <FiShield className="w-3 h-3 shrink-0" />
                    Hash: {c.contentHash.slice(0, 16)}…
                  </p>
                )}
              </div>
              <a
                href={`/sozlesme/${c.slug}?t=${c.accessToken}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-blue-600 hover:underline shrink-0"
              >
                <FiDownload className="w-4 h-4" />
                Görüntüle
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
