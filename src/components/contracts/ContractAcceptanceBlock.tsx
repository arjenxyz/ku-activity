'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { FiCheckCircle, FiChevronRight, FiFileText } from 'react-icons/fi';

import { formatString } from '@/lib/strings/format';
import { ContractAcceptanceModal } from './ContractAcceptanceModal';
import type { ContractItem } from './ContractScrollReader';

type Props = {
  onAllAccepted: (acceptances: Array<{ contractId: string; version: number }>) => void;
  onIncomplete: () => void;
  /** default: kart listesi | sidebar: dar sütun | gate: tek satır + sıralı modal */
  layout?: 'default' | 'sidebar' | 'gate';
  /** Koyu cam arka plan (personel başvuru) */
  appearance?: 'default' | 'glass';
  /** Başvuru taslağından geri yükleme */
  initialAcceptances?: Array<{ contractId: string; version: number }>;
};

export function ContractAcceptanceBlock({
  onAllAccepted,
  onIncomplete,
  layout = 'default',
  appearance = 'default',
  initialAcceptances,
}: Props) {

  const strings = useRegistryStrings('components/contracts/ContractAcceptanceBlock');
  const isSidebar = layout === 'sidebar';
  const isGate = layout === 'gate';
  const isGlass = appearance === 'glass';
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
          setError(strings.loadFailedAdmin);
          return;
        }
        setContracts(d.contracts);
      })
      .catch(() => setError(strings.loadFailed))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!initialAcceptances?.length || !contracts.length) return;
    const restored: Record<string, boolean> = {};
    for (const item of initialAcceptances) {
      const match = contracts.find((c) => c.id === item.contractId && c.version === item.version);
      if (match) restored[item.contractId] = true;
    }
    if (Object.keys(restored).length > 0) {
      setAccepted(restored);
    }
  }, [initialAcceptances, contracts]);

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
        {strings.loading}
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
  const countVars = { accepted: acceptedCount, total: contracts.length };

  if (isGate) {
    return (
      <>
        <div
          className={`rounded-xl border p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 backdrop-blur-md ${
            isGlass
              ? allDone
                ? 'border-emerald-400/30 bg-emerald-500/15'
                : 'border-white/20 bg-white/10'
              : allDone
                ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/20'
                : 'border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40'
          }`}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {allDone ? (
                <FiCheckCircle className={`w-4 h-4 shrink-0 ${isGlass ? 'text-emerald-300' : 'text-emerald-600'}`} />
              ) : (
                <FiFileText className={`w-4 h-4 shrink-0 ${isGlass ? 'text-sky-300' : 'text-blue-600'}`} />
              )}
              <p className={`text-sm font-semibold ${isGlass ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                {allDone ? strings.gateComplete : strings.gateTitle}
              </p>
              <span className={`text-xs sm:hidden ${isGlass ? 'text-white/55' : 'text-slate-500'}`}>
                {acceptedCount}/{contracts.length}
              </span>
            </div>
            <p
              className={`mt-1 text-xs leading-relaxed hidden sm:block ${
                isGlass ? 'text-white/60' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {allDone ? strings.gateReadyHint : strings.gatePendingHint}
            </p>
            <div className="hidden sm:flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1.5" aria-hidden>
                {contracts.map((c) => (
                  <span
                    key={c.id}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      accepted[c.id]
                        ? 'bg-emerald-500'
                        : isGlass
                          ? 'bg-white/30'
                          : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  />
                ))}
              </div>
              <span
                className={`text-xs font-medium ${
                  isGlass ? 'text-white/75' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {formatString(strings.acceptedCount, countVars)}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={openGate}
            className={`shrink-0 w-full sm:w-auto min-h-[40px] px-4 py-2 rounded-xl text-sm font-semibold transition-colors touch-manipulation ${
              allDone
                ? isGlass
                  ? 'border border-white/25 bg-white/10 text-white hover:bg-white/15'
                  : 'border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800'
                : isGlass
                  ? 'bg-sky-500/85 hover:bg-sky-400/90 text-white border border-white/15'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {allDone
              ? strings.reviewContracts
              : acceptedCount === 0
                ? strings.openContracts
                : formatString(strings.resumeContracts, countVars)}
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
            <p className="font-medium">{strings.requiredTitle}</p>
            <p className="mt-1 text-xs text-blue-800 dark:text-blue-200/90">
              {formatString(strings.requiredHint, countVars)}
            </p>
          </div>
        )}
        {isSidebar && (
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {strings.sidebarHint}{' '}
            <span className="font-medium text-slate-800 dark:text-slate-200">
              {formatString(strings.sidebarComplete, countVars)}
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
                      {formatString(strings.version, { version: contract.version })}
                      {isAccepted ? strings.accepted : strings.openAndRead}
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
