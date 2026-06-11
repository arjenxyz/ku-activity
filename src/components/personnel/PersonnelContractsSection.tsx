'use client';

import { useEffect, useState } from 'react';
import { FiDownload, FiFileText } from 'react-icons/fi';
import { formatDate } from '@/lib/format';

type ContractRow = {
  slug: string;
  title: string;
  version: number;
  acceptedAt: string;
  accessToken: string;
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
        Sözleşmelerim
      </p>
      <ul className="space-y-2">
        {contracts.map((c) => (
          <li
            key={c.slug}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-slate-600 px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{c.title}</p>
              <p className="text-xs text-gray-500">
                Sürüm {c.version} · Onay: {formatDate(c.acceptedAt.slice(0, 10))}
              </p>
            </div>
            <a
              href={`/sozlesme/${c.slug}?t=${c.accessToken}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-blue-600 hover:underline shrink-0"
            >
              <FiDownload className="w-4 h-4" />
              Görüntüle / İndir
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
