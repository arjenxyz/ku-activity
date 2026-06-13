'use client';

import { useState } from 'react';
import { FiAlertTriangle, FiCheckCircle, FiTrash2 } from 'react-icons/fi';
import {
  deleteProjectRecord,
  updateProjectRecord,
} from '@/lib/project-api';
import { formatDateTime } from '@/lib/format';
import { formatWorkLogSummary, type MesaiType } from '@/lib/work-log';
import { MESAI_OPTIONS } from '@/lib/work-log';
import { btnPrimary, btnSecondary, inputClass, labelClass } from '@/components/project/ui';

export type DisputedWorkLog = {
  id: string;
  date: string;
  amount: number;
  mesai_type?: string | null;
  mesai_units?: number;
  description?: string | null;
  employee_dispute_note: string;
  employee_disputed_at: string;
  employees?: { name: string } | null;
};

type Props = {
  projectId: string;
  record: DisputedWorkLog;
  onChanged: () => void;
};

export function AdminWorkLogDisputeActions({ projectId, record, onChanged }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    date: record.date,
    amount: String(record.amount),
    mesaiType: (record.mesai_type ?? 'none') as MesaiType,
    description: record.description ?? '',
  });

  const openResolve = () => {
    setForm({
      date: record.date,
      amount: String(record.amount),
      mesaiType: (record.mesai_type ?? 'none') as MesaiType,
      description: record.description ?? '',
    });
    setError(null);
    setOpen(true);
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (amount !== 1 && amount !== 0.5) {
      setError('Gün miktarı tam (1) veya yarım (0.5) olmalı');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await updateProjectRecord(projectId, 'work-logs', record.id, {
        date: form.date,
        amount,
        description: form.description || null,
        mesaiType: form.mesaiType,
        resolveDispute: true,
      });
      setOpen(false);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt güncellenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        'Bu yevmiye kaydını silmek istediğinize emin misiniz? Personelin itirazı da kapanır.'
      )
    ) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await deleteProjectRecord(projectId, 'work-logs', record.id);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Silinemedi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2 justify-end">
        <button
          type="button"
          onClick={openResolve}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50 min-h-[36px]"
        >
          <FiCheckCircle className="w-3.5 h-3.5" />
          Düzelt ve yeniden gönder
        </button>
        <button
          type="button"
          onClick={() => void handleDelete()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold disabled:opacity-50 min-h-[36px]"
        >
          <FiTrash2 className="w-3.5 h-3.5" />
          Kaydı sil
        </button>
      </div>
      {error && !open && <p className="text-xs text-red-600 mt-2 text-right">{error}</p>}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5 space-y-4 max-h-[90dvh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-900">İtirazı çöz</h3>
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-950">
              <p className="font-medium flex items-center gap-1.5">
                <FiAlertTriangle className="w-4 h-4 shrink-0" />
                Personel itirazı
              </p>
              <p className="text-xs mt-1 opacity-90">{record.employee_dispute_note}</p>
              <p className="text-[11px] mt-1 text-amber-800">
                {formatDateTime(record.employee_disputed_at)}
              </p>
            </div>
            <p className="text-xs text-slate-600">
              Kaydı düzelttikten sonra personelin tekrar onaylaması gerekir.
            </p>
            <form onSubmit={handleResolve} className="space-y-3">
              <div>
                <label className={labelClass}>Tarih</label>
                <input
                  type="date"
                  className={inputClass}
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Gün</label>
                <select
                  className={inputClass}
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                >
                  <option value="1">Tam gün (1)</option>
                  <option value="0.5">Yarım gün (0.5)</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Mesai</label>
                <select
                  className={inputClass}
                  value={form.mesaiType}
                  onChange={(e) =>
                    setForm({ ...form, mesaiType: e.target.value as MesaiType })
                  }
                  disabled={form.amount !== '1'}
                >
                  {MESAI_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Açıklama</label>
                <input
                  type="text"
                  className={inputClass}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <p className="text-xs text-slate-500">
                Önizleme:{' '}
                {formatWorkLogSummary(Number(form.amount), form.mesaiType)}
              </p>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2 pt-1">
                <button type="submit" className={btnPrimary} disabled={loading}>
                  {loading ? 'Kaydediliyor…' : 'Personel onayına gönder'}
                </button>
                <button
                  type="button"
                  className={btnSecondary}
                  onClick={() => setOpen(false)}
                  disabled={loading}
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function AdminDisputeNote({ record }: { record: DisputedWorkLog }) {
  return (
    <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 px-3 py-2 text-sm">
      <p className="font-medium text-amber-950 dark:text-amber-100 flex items-start gap-1.5">
        <FiAlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        {record.employee_dispute_note}
      </p>
      <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
        İtiraz: {formatDateTime(record.employee_disputed_at)}
      </p>
    </div>
  );
}
