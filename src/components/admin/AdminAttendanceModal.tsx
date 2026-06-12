'use client';

import { useState } from 'react';
import { FiX } from 'react-icons/fi';
import { DAY_AMOUNT_OPTIONS, MESAI_OPTIONS, type MesaiType } from '@/lib/work-log';

type Props = {
  employeeName: string;
  isOpen: boolean;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (data: { amount: number; mesaiType: MesaiType; description: string }) => void;
};

export function AdminAttendanceModal({
  employeeName,
  isOpen,
  loading,
  onClose,
  onSubmit,
}: Props) {
  const [amount, setAmount] = useState(1);
  const [mesaiType, setMesaiType] = useState<MesaiType>('none');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const inputClass =
    'w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm';

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6 relative border border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-800"
          aria-label="Kapat"
        >
          <FiX className="w-5 h-5" />
        </button>

        <h2 className="font-bold text-lg text-slate-900 dark:text-white pr-8">Günlük yoklama</h2>
        <p className="text-sm text-slate-500 mt-1 mb-4">{employeeName}</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Çalışma günü</label>
            <select
              className={inputClass}
              value={amount}
              onChange={(e) => {
                const next = Number(e.target.value);
                setAmount(next);
                if (next < 1) setMesaiType('none');
              }}
            >
              {DAY_AMOUNT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Mesai</label>
            <select
              className={inputClass}
              value={mesaiType}
              onChange={(e) => setMesaiType(e.target.value as MesaiType)}
              disabled={amount < 1}
            >
              {MESAI_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">
              {amount < 1
                ? 'Mesai yalnızca tam gün çalışmada tanımlanır.'
                : MESAI_OPTIONS.find((o) => o.value === mesaiType)?.hint}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Not (isteğe bağlı)</label>
            <input
              className={inputClass}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Örn. gece mesaisi, kalıntı iş"
            />
          </div>

          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            Yönetici onayından sonra personelin de aynı günü onaylaması gerekir. İki taraf onaylayınca
            yevmiye kesinleşir.
          </p>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              disabled={loading}
              onClick={() => onSubmit({ amount, mesaiType: amount < 1 ? 'none' : mesaiType, description })}
              className="flex-1 bg-slate-800 hover:bg-slate-900 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Kaydediliyor…' : 'Onayla ve personele gönder'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-200 py-2.5 rounded-xl text-sm font-medium"
            >
              Vazgeç
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
