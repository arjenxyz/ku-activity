'use client';

import { useState } from 'react';
import dayjs from 'dayjs';
import { createJobExpense, deleteJobExpense } from '@/lib/project-api';
import { formatDate, formatMoney } from '@/lib/format';
import type { ProjectJobExpense, ProjectProfitOverview } from '@/types/project-job';
import { cardClass, inputClass, labelClass, btnPrimary } from '@/components/project/ui';

type Props = {
  projectId: string;
  jobId: string;
  expenses: ProjectJobExpense[];
  materialCost: number;
  disabled?: boolean;
  onOverview: (overview: ProjectProfitOverview) => void;
};

export function JobExpenseSection({
  projectId,
  jobId,
  expenses,
  materialCost,
  disabled,
  onOverview,
}: Props) {
  const [form, setForm] = useState({
    date: dayjs().format('YYYY-MM-DD'),
    amount: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount) return;
    setLoading(true);
    setError(null);
    try {
      const { overview } = await createJobExpense(projectId, jobId, {
        date: form.date,
        amount: Number(form.amount),
        description: form.description || undefined,
      });
      onOverview(overview);
      setForm({ date: dayjs().format('YYYY-MM-DD'), amount: '', description: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gider eklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (expenseId: string) => {
    if (!confirm('Bu malzeme giderini silmek istiyor musunuz?')) return;
    setLoading(true);
    setError(null);
    try {
      const { overview } = await deleteJobExpense(projectId, jobId, expenseId);
      onOverview(overview);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Silinemedi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-t border-slate-100 bg-slate-50/50 p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-slate-800">Malzeme giderleri</h4>
        <span className="text-sm text-slate-600">Toplam: {formatMoney(materialCost)}</span>
      </div>
      <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
        <div>
          <label className={labelClass}>Tarih</label>
          <input
            type="date"
            className={inputClass}
            value={form.date}
            onChange={(e) => setForm((s) => ({ ...s, date: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className={labelClass}>Tutar (₺)</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            className={inputClass}
            value={form.amount}
            onChange={(e) => setForm((s) => ({ ...s, amount: e.target.value }))}
            required
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Açıklama</label>
          <input
            className={inputClass}
            placeholder="Örn. kiremit, çimento"
            value={form.description}
            onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
          />
        </div>
        <button type="submit" className={`${btnPrimary} sm:col-span-4`} disabled={loading || disabled}>
          Gider ekle
        </button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {expenses.length > 0 ? (
        <ul className={`${cardClass} divide-y divide-slate-100`}>
          {expenses.map((exp) => (
            <li key={exp.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
              <span className="text-slate-700">
                {formatDate(exp.date)} — {formatMoney(Number(exp.amount))}
                {exp.description ? ` · ${exp.description}` : ''}
              </span>
              <button
                type="button"
                className="text-red-600 text-xs hover:underline shrink-0"
                disabled={loading || disabled}
                onClick={() => handleDelete(exp.id)}
              >
                Sil
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-slate-500">Henüz malzeme gideri yok.</p>
      )}
    </div>
  );
}
