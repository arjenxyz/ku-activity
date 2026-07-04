'use client';

import { useEffect, useState } from 'react';
import { inputClass, labelClass, btnPrimary, btnSecondary } from '@/components/project/ui';
import { formatMoney } from '@/lib/format';
import type { ProjectBlock } from '@/types/project-block';
import strings from '@json/src/components/project/profit/AddJobModal.json';

type JobForm = {
  name: string;
  unitLabel: string;
  unitPrice: string;
  quantity: string;
  notes: string;
  blockId: string;
};

const emptyForm: JobForm = {
  name: '',
  unitLabel: strings.defaultUnit,
  unitPrice: '',
  quantity: '',
  notes: '',
  blockId: '',
};

type Props = {
  open: boolean;
  onClose: () => void;
  blocks?: ProjectBlock[];
  onSubmit: (data: {
    name: string;
    unitLabel: string;
    unitPrice: number;
    quantity: number;
    notes?: string;
    blockId?: string | null;
  }) => Promise<void>;
  saving?: boolean;
};

export function AddJobModal({ open, onClose, onSubmit, saving, blocks = [] }: Props) {
  const [form, setForm] = useState<JobForm>(emptyForm);
  const activeBlocks = blocks.filter((b) => b.status === 'active');

  useEffect(() => {
    if (!open) setForm(emptyForm);
  }, [open]);

  if (!open) return null;

  const preview =
    form.unitPrice && form.quantity ? Number(form.unitPrice) * Number(form.quantity) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      name: form.name,
      unitLabel: form.unitLabel,
      unitPrice: Number(form.unitPrice),
      quantity: Number(form.quantity),
      notes: form.notes || undefined,
      blockId: form.blockId || null,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">{strings.title}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{strings.subtitle}</p>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className={labelClass}>{strings.nameLabel}</label>
            <input
              className={inputClass}
              required
              autoFocus
              placeholder={strings.namePlaceholder}
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            />
          </div>
          {activeBlocks.length > 0 && (
            <div>
              <label className={labelClass}>{strings.blockLabel}</label>
              <select
                className={inputClass}
                value={form.blockId}
                onChange={(e) => setForm((s) => ({ ...s, blockId: e.target.value }))}
              >
                <option value="">{strings.blockNotSelected}</option>
                {activeBlocks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{strings.unitPriceLabel}</label>
              <input
                className={inputClass}
                type="number"
                min="0"
                step="0.01"
                required
                placeholder={strings.unitPricePlaceholder}
                value={form.unitPrice}
                onChange={(e) => setForm((s) => ({ ...s, unitPrice: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelClass}>{strings.quantityLabel}</label>
              <input
                className={inputClass}
                type="number"
                min="0.01"
                step="0.01"
                required
                placeholder={strings.quantityPlaceholder}
                value={form.quantity}
                onChange={(e) => setForm((s) => ({ ...s, quantity: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>{strings.unitLabel}</label>
            <input
              className={inputClass}
              value={form.unitLabel}
              onChange={(e) => setForm((s) => ({ ...s, unitLabel: e.target.value }))}
            />
          </div>
          {preview != null && !Number.isNaN(preview) && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3">
              <p className="text-xs text-emerald-700 font-medium">{strings.previewLabel}</p>
              <p className="text-xl font-bold text-emerald-900">{formatMoney(preview)}</p>
            </div>
          )}
          <div>
            <label className={labelClass}>{strings.notesLabel}</label>
            <input
              className={inputClass}
              placeholder={strings.notesPlaceholder}
              value={form.notes}
              onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" className={btnPrimary} disabled={saving}>
              {saving ? strings.submitSaving : strings.submit}
            </button>
            <button type="button" className={btnSecondary} onClick={onClose} disabled={saving}>
              {strings.cancel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
