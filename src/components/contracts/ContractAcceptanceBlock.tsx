'use client';

import { useEffect, useState } from 'react';
import { ContractScrollReader, type ContractItem } from './ContractScrollReader';

type Props = {
  onAllAccepted: (acceptances: Array<{ contractId: string; version: number }>) => void;
  onIncomplete: () => void;
};

export function ContractAcceptanceBlock({ onAllAccepted, onIncomplete }: Props) {
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accepted, setAccepted] = useState<Record<string, boolean>>({});

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

  const handleAcceptChange = (contractId: string, value: boolean) => {
    setAccepted((prev) => ({ ...prev, [contractId]: value }));
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 p-6 text-center text-sm text-slate-500">
        Sözleşmeler yükleniyor…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        <p className="font-medium">Zorunlu sözleşmeler</p>
        <p className="text-xs mt-1 text-blue-800">
          Başvuruyu göndermeden önce her sözleşmeyi <strong>sonuna kadar</strong> okuyup onaylamanız
          gerekir. Onayladığınız metinlere personel panelinden istediğiniz zaman erişebilirsiniz.
        </p>
      </div>
      {contracts.map((contract) => (
        <ContractScrollReader
          key={contract.id}
          contract={contract}
          accepted={Boolean(accepted[contract.id])}
          onAcceptChange={handleAcceptChange}
        />
      ))}
    </div>
  );
}
