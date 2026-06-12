'use client';

import { useCallback, useEffect, useState } from 'react';
import { FiCheckCircle, FiChevronRight, FiFileText } from 'react-icons/fi';
import { ContractAcceptanceModal } from './ContractAcceptanceModal';
import type { ContractItem } from './ContractScrollReader';

type Props = {
  onAllAccepted: (acceptances: Array<{ contractId: string; version: number }>) => void;
  onIncomplete: () => void;
  /** default: kart listesi | sidebar: dar sütun | gate: tek satır + sıralı modal */
  layout?: 'default' | 'sidebar' | 'gate';
};

export function ContractAcceptanceBlock({
  onAllAccepted,
  onIncomplete,
  layout = 'default',
}: Props) {
  const isSidebar = layout === 'sidebar';
  const isGate = layout === 'gate';
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
    const nextAccepted = { ...accepted, [contractId]: true };
    setAccepted(nextAccepted);

    if (isGate) {
      const nextContract = contracts.find((c) => !nextAccepted[c.id]) ?? null;
      setOpenContract(nextContract);
    }
  };

  const openGate = useCallback(() => {
    const next = contracts.find((c) => !accepted[c.id]) ?? contracts[0] ?? null;
    setOpenContract(next);
  }, [accepted, contracts]);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center text-sm text-slate-500">
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
  const allDone = acceptedCount === contracts.length && contracts.length > 0;
  const openContractIndex = openContract
    ? contracts.findIndex((c) => c.id === openContract.id)
    : -1;

  if (isGate) {
    return (
      <>
        <div
          className={`rounded-xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 ${
            allDone
              ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/20'
              : 'border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40'
          }`}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {allDone ? (
                <FiCheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <FiFileText className="w-5 h-5 text-blue-600 shrink-0" />
              )}
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {allDone ? 'Tüm sözleşmeler onaylandı' : 'Sözleşmeler'}
              </p>
            </div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {allDone
                ? 'Başvuruyu gönderebilirsiniz. İsterseniz sözleşmeleri yeniden gözden geçirebilirsiniz.'
                : 'Her sözleşmeyi sırayla açıp sonuna kadar okuyup onaylamanız gerekir.'}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center gap-1.5" aria-hidden>
                {contracts.map((c) => (
                  <span
                    key={c.id}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      accepted[c.id] ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {acceptedCount}/{contracts.length} onaylandı
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={openGate}
            className={`shrink-0 w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors touch-manipulation ${
              allDone
                ? 'border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {allDone
              ? 'Gözden geçir'
              : acceptedCount === 0
                ? 'Sözleşmeleri oku'
                : `Devam et (${acceptedCount}/${contracts.length})`}
          </button>
        </div>

        {openContract && (
          <ContractAcceptanceModal
            contract={openContract}
            accepted={Boolean(accepted[openContract.id])}
            onAccept={() => handleAccept(openContract.id)}
            onClose={() => setOpenContract(null)}
            closeOnAccept={false}
            stepLabel={
              openContractIndex >= 0
                ? `${openContractIndex + 1} / ${contracts.length}`
                : undefined
            }
          />
        )}
      </>
    );
  }

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
                    {contract.summary && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2 leading-snug">
                        {contract.summary}
                      </p>
                    )}
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
