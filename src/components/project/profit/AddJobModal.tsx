'use client';

import { useEffect, useState } from 'react';
import { inputClass, labelClass, btnPrimary, btnSecondary } from '@/components/project/ui';
import { formatMoney } from '@/lib/format';

type JobForm = {
  name: string;
  unitLabel: string;
  unitPrice: string;
  quantity: string;
  notes: string;
};

const emptyForm: JobForm = {
  name: '',
  unitLabel: 'm²',
  unitPrice: '',
  quantity: '',
  notes: '',
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    unitLabel: string;
    unitPrice: number;
    quantity: number;
    notes?: string;
  }) => Promise<void>;
  saving?: boolean;
};

export function AddJobModal({ open, onClose, onSubmit, saving }: Props) {
  const [form, setForm] = useState<JobForm>(emptyForm);

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
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Yeni iş kalemi</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Üst taşerondan aldığınız işi tanımlayın — alacak otomatik hesaplanır.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className={labelClass}>İş adı *</label>
            <input
              className={inputClass}
              required
              autoFocus
              placeholder="Örn. Çatı kaplama"
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Birim fiyat (₺) *</label>
              <input
                className={inputClass}
                type="number"
                min="0"
                step="0.01"
                required
                placeholder="100"
                value={form.unitPrice}
                onChange={(e) => setForm((s) => ({ ...s, unitPrice: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelClass}>Miktar *</label>
              <input
                className={inputClass}
                type="number"
                min="0.01"
                step="0.01"
                required
                placeholder="890"
                value={form.quantity}
                onChange={(e) => setForm((s) => ({ ...s, quantity: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Birim</label>
            <input
              className={inputClass}
              value={form.unitLabel}
              onChange={(e) => setForm((s) => ({ ...s, unitLabel: e.target.value }))}
            />
          </div>
          {preview != null && !Number.isNaN(preview) && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3">
              <p className="text-xs text-emerald-700 font-medium">Toplam alacak</p>
              <p className="text-xl font-bold text-emerald-900">{formatMoney(preview)}</p>
            </div>
          )}
          <div>
            <label className={labelClass}>Not (isteğe bağlı)</label>
            <input
              className={inputClass}
              placeholder="Blok, kat, açıklama…"
              value={form.notes}
              onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" className={btnPrimary} disabled={saving}>
              {saving ? 'Kaydediliyor…' : 'Ekle'}
            </button>
            <button type="button" className={btnSecondary} onClick={onClose} disabled={saving}>
              İptal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
