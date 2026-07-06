'use client';

import { useEffect, useState } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { FiX } from 'react-icons/fi';
import { DAY_AMOUNT_OPTIONS, MESAI_OPTIONS, type MesaiType } from '@/lib/work-log';

type Props = {
  employeeName: string;
  isOpen: boolean;
  loading?: boolean;
  initialAmount?: number;
  initialMesaiType?: MesaiType;
  initialDescription?: string;
  hint?: string;
  submitLabel?: string;
  onClose: () => void;
  onSubmit: (data: { amount: number; mesaiType: MesaiType; description: string }) => void;
};

export function AdminAttendanceModal({
  employeeName,
  isOpen,
  loading,
  initialAmount = 1,
  initialMesaiType = 'none',
  initialDescription = '',
  hint,
  submitLabel,
  onClose,
  onSubmit,
}: Props) {
  const strings = useRegistryStrings('components/admin/AdminAttendanceModal');
  const [amount, setAmount] = useState(initialAmount);
  const [mesaiType, setMesaiType] = useState<MesaiType>(initialMesaiType);
  const [description, setDescription] = useState(initialDescription);

  useEffect(() => {
    if (!isOpen) return;
    setAmount(initialAmount);
    setMesaiType(initialMesaiType);
    setDescription(initialDescription);
  }, [isOpen, initialAmount, initialMesaiType, initialDescription]);

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
          aria-label={strings.closeAriaLabel}
        >
          <FiX className="w-5 h-5" />
        </button>

        <h2 className="font-bold text-lg text-slate-900 dark:text-white pr-8">{strings.title}</h2>
        <p className="text-sm text-slate-500 mt-1 mb-4">{employeeName}</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">{strings.workDayLabel}</label>
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
            <label className="block text-sm font-medium mb-1.5">{strings.mesaiLabel}</label>
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
                ? strings.mesaiHintDisabled
                : MESAI_OPTIONS.find((o) => o.value === mesaiType)?.hint}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">{strings.noteLabel}</label>
            <input
              className={inputClass}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={strings.notePlaceholder}
            />
          </div>

          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            {hint ?? strings.approvalHint}
          </p>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              disabled={loading}
              onClick={() => onSubmit({ amount, mesaiType: amount < 1 ? 'none' : mesaiType, description })}
              className="flex-1 bg-slate-800 hover:bg-slate-900 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
            >
              {loading ? strings.submitSaving : submitLabel ?? strings.submit}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-200 py-2.5 rounded-xl text-sm font-medium"
            >
              {strings.cancel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
