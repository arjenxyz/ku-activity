'use client';

import { useState } from 'react';
import dayjs from 'dayjs';
import { FiChevronDown, FiTrash2 } from 'react-icons/fi';
import { JobQuickLinks } from '@/components/project/profit/ProfitQuickActions';
import { ProfitWaterfall } from '@/components/project/profit/ProfitWaterfall';
import { cardClass, inputClass, labelClass, btnPrimary, btnSecondary } from '@/components/project/ui';
import { formatMoney, formatDate } from '@/lib/format';
import { profitMarginPercent } from '@/lib/profit-display';
import { createJobExpense, deleteJobExpense } from '@/lib/project-api';
import type { ExtendedProfitOverview, JobProfitSummary } from '@/types/project-job';
import { PROJECT_JOB_STATUS_LABELS } from '@/types/project-job';

type Props = {
  projectId: string;
  item: JobProfitSummary;
  expanded: boolean;
  onToggle: () => void;
  disabled?: boolean;
  onOverview: (overview: ExtendedProfitOverview) => void;
  onToggleStatus: () => void;
  onDelete: () => void;
};

export function JobProfitCard({
  projectId,
  item,
  expanded,
  onToggle,
  disabled,
  onOverview,
  onToggleStatus,
  onDelete,
}: Props) {
  const { job } = item;
  const margin = profitMarginPercent(item.profitApproved, item.contractTotal);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    date: dayjs().format('YYYY-MM-DD'),
    amount: '',
    description: '',
  });
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [expenseError, setExpenseError] = useState<string | null>(null);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.amount) return;
    setExpenseLoading(true);
    setExpenseError(null);
    try {
      const { overview } = await createJobExpense(projectId, job.id, {
        date: expenseForm.date,
        amount: Number(expenseForm.amount),
        description: expenseForm.description || undefined,
      });
      onOverview(overview);
      setExpenseForm({ date: dayjs().format('YYYY-MM-DD'), amount: '', description: '' });
      setShowExpenseForm(false);
    } catch (err) {
      setExpenseError(err instanceof Error ? err.message : 'Eklenemedi');
    } finally {
      setExpenseLoading(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('Bu gideri silmek istiyor musunuz?')) return;
    setExpenseLoading(true);
    try {
      const { overview } = await deleteJobExpense(projectId, job.id, expenseId);
      onOverview(overview);
    } finally {
      setExpenseLoading(false);
    }
  };

  return (
    <article className={`${cardClass} overflow-hidden`}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex items-start gap-3"
      >
        <FiChevronDown
          className={`w-5 h-5 text-slate-400 shrink-0 mt-0.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-slate-900 text-base">{job.name}</h3>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                job.status === 'completed'
                  ? 'bg-slate-200 text-slate-600'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {PROJECT_JOB_STATUS_LABELS[job.status]}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Alacak {formatMoney(item.contractTotal)}
            <span className="text-slate-300 mx-2">·</span>
            Gider {formatMoney(item.totalCostApproved)}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p
            className={`text-lg sm:text-xl font-bold tabular-nums ${
              item.profitApproved >= 0 ? 'text-emerald-700' : 'text-red-600'
            }`}
          >
            {formatMoney(item.profitApproved)}
          </p>
          <p className="text-xs text-slate-500">
            {margin}% marj
            {item.shareCount > 1 && ` · ${formatMoney(item.profitPerShareApproved)}/kişi`}
          </p>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100">
          <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Hesap özeti
              </h4>
              <ProfitWaterfall item={item} />
              {item.pendingWorkDays > 0 && (
                <p className="mt-3 text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  <strong>{item.pendingWorkDays} gün</strong> onay bekliyor. Onaylanırsa tahmini kâr{' '}
                  <strong>{formatMoney(item.profitPending)}</strong> olabilir.
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Hızlı işlem
                </h4>
                <p className="text-xs text-slate-500 mb-2">
                  Kayıt girerken bu iş otomatik seçilir.
                </p>
                <JobQuickLinks projectId={projectId} jobId={job.id} />
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Malzeme ({formatMoney(item.materialCost)})
                  </h4>
                  <button
                    type="button"
                    className="text-xs font-medium text-emerald-700 hover:underline"
                    onClick={() => setShowExpenseForm((v) => !v)}
                  >
                    {showExpenseForm ? 'Kapat' : '+ Gider ekle'}
                  </button>
                </div>
                {showExpenseForm && (
                  <form onSubmit={handleAddExpense} className="space-y-2 mb-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={labelClass}>Tarih</label>
                        <input
                          type="date"
                          className={inputClass}
                          value={expenseForm.date}
                          onChange={(e) =>
                            setExpenseForm((s) => ({ ...s, date: e.target.value }))
                          }
                          required
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Tutar</label>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          className={inputClass}
                          value={expenseForm.amount}
                          onChange={(e) =>
                            setExpenseForm((s) => ({ ...s, amount: e.target.value }))
                          }
                          required
                        />
                      </div>
                    </div>
                    <input
                      className={inputClass}
                      placeholder="Açıklama (kiremit, çimento…)"
                      value={expenseForm.description}
                      onChange={(e) =>
                        setExpenseForm((s) => ({ ...s, description: e.target.value }))
                      }
                    />
                    {expenseError && <p className="text-xs text-red-600">{expenseError}</p>}
                    <button
                      type="submit"
                      className={`${btnPrimary} w-full`}
                      disabled={expenseLoading || disabled}
                    >
                      Kaydet
                    </button>
                  </form>
                )}
                {item.expenses.length > 0 ? (
                  <ul className="divide-y divide-slate-100 rounded-lg border border-slate-100 bg-white text-sm">
                    {item.expenses.map((exp) => (
                      <li
                        key={exp.id}
                        className="flex items-center justify-between gap-2 px-3 py-2"
                      >
                        <span className="text-slate-700 truncate">
                          {formatDate(exp.date)} · {formatMoney(Number(exp.amount))}
                          {exp.description ? ` · ${exp.description}` : ''}
                        </span>
                        <button
                          type="button"
                          className="text-slate-400 hover:text-red-600 p-1"
                          disabled={expenseLoading || disabled}
                          onClick={() => handleDeleteExpense(exp.id)}
                          title="Sil"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400">Malzeme gideri yok.</p>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  className={btnSecondary}
                  disabled={disabled}
                  onClick={onToggleStatus}
                >
                  {job.status === 'active' ? 'Tamamlandı' : 'Yeniden aç'}
                </button>
                <button
                  type="button"
                  className="text-sm text-red-600 hover:underline px-2 py-2"
                  disabled={disabled}
                  onClick={onDelete}
                >
                  İşi sil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
