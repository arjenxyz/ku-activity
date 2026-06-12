'use client';

import { useEffect, useState } from 'react';
import { FiCheckCircle, FiChevronRight } from 'react-icons/fi';
import { ContractAcceptanceModal } from './ContractAcceptanceModal';
import type { ContractItem } from './ContractScrollReader';

type Props = {
  onAllAccepted: (acceptances: Array<{ contractId: string; version: number }>) => void;
  onIncomplete: () => void;
  /** Sağ sütun dar alan için tek sütun kompakt görünüm */
  layout?: 'default' | 'sidebar';
};

export function ContractAcceptanceBlock({
  onAllAccepted,
  onIncomplete,
  layout = 'default',
}: Props) {
  const isSidebar = layout === 'sidebar';
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accepted, setAccepted] = useState<Record<string, boolean>>({});
  const [openContract, setOpenContract] = useState<ContractItem | null>(null);

  useEffect(() => {
    fetch('/api/public/contracts')
      .then((r) => r.json())
      .then((d) => {
        if (!d.contracts?.length) {
          setError('Sözleşmeler yüklenemedi. Yöneticinize bildirin.');
          return;
        }
        setContracts(d.contracts);
      })
      .catch(() => setError('Sözleşmeler yüklenemedi.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const required = contracts;
    const allDone =
      required.length > 0 && required.every((c) => accepted[c.id]);

    if (allDone) {
      onAllAccepted(
        required.map((c) => ({ contractId: c.id, version: c.version }))
      );
    } else {
      onIncomplete();
    }
  }, [accepted, contracts, onAllAccepted, onIncomplete]);

  const handleAccept = (contractId: string) => {
    setAccepted((prev) => ({ ...prev, [contractId]: true }));
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 p-4 text-center text-sm text-slate-500">
        Sözleşmeler yükleniyor…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
    );
  }

  const acceptedCount = contracts.filter((c) => accepted[c.id]).length;

  return (
    <>
      <div className="space-y-3">
        {!isSidebar && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900 px-4 py-3 text-sm text-blue-900 dark:text-blue-100">
            <p className="font-medium">Zorunlu sözleşmeler</p>
            <p className="mt-1 text-xs text-blue-800 dark:text-blue-200/90">
              Her sözleşmeyi açıp <strong>sonuna kadar</strong> okuyun ({acceptedCount}/
              {contracts.length}).
            </p>
          </div>
        )}
        {isSidebar && (
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Her sözleşmeyi sonuna kadar okuyup onaylayın.{' '}
            <span className="font-medium text-slate-800 dark:text-slate-200">
              {acceptedCount}/{contracts.length} tamam
            </span>
          </p>
        )}

        <ul
          className={`grid gap-2 ${isSidebar ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 gap-3'}`}
        >
          {contracts.map((contract) => {
            const isAccepted = Boolean(accepted[contract.id]);
            return (
              <li key={contract.id}>
                <button
                  type="button"
                  onClick={() => setOpenContract(contract)}
                  className={`w-full h-full flex items-center gap-3 text-left rounded-lg border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm active:bg-slate-50 dark:active:bg-slate-800/80 transition-all ${
                    isSidebar ? 'min-h-[56px] px-3 py-2.5' : 'min-h-[72px] px-4 py-3.5'
                  }`}
                >
                  {isAccepted ? (
                    <FiCheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <span className="w-5 h-5 rounded-full border-2 border-slate-300 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`font-medium text-slate-900 dark:text-white ${
                        isSidebar ? 'text-sm leading-snug line-clamp-2' : 'text-sm truncate'
                      }`}
                    >
                      {contract.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Sürüm {contract.version}
                      {isAccepted ? ' · Onaylandı' : ' · Okunup onaylanmalı'}
                    </p>
                  </div>
                  <FiChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {openContract && (
        <ContractAcceptanceModal
          contract={openContract}
          accepted={Boolean(accepted[openContract.id])}
          onAccept={() => handleAccept(openContract.id)}
          onClose={() => setOpenContract(null)}
        />
      )}
    </>
  );
}
