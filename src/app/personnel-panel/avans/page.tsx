'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import dayjs from 'dayjs';
import { FiArrowLeft, FiPlus, FiXCircle } from 'react-icons/fi';
import { formatMoney } from '@/lib/format';
import {
  ADVANCE_STATUS_LABELS,
  canCancelAdvance,
  type AdvanceRequestStatus,
} from '@/lib/advance-types';

type RequestRow = {
  id: string;
  requested_amount: number;
  approved_amount: number | null;
  employee_note: string | null;
  admin_note: string | null;
  status: AdvanceRequestStatus;
  payment_method: 'bank_transfer' | 'cash' | null;
  requested_at: string;
  approved_at: string | null;
  paid_at: string | null;
  rejection_reason: string | null;
};

export default function PersonnelAvansPage() {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/personnel/advance-requests');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Yüklenemedi');
      setRequests(data.requests ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/personnel/advance-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(amount), note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Talep gönderilemedi');
      setShowForm(false);
      setAmount('');
      setNote('');
      setSuccess('Avans talebiniz iletildi. Onay bekleniyor.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Talep gönderilemedi');
    } finally {
      setSubmitting(false);
    }
  };

  const cancelRequest = async (id: string) => {
    if (!window.confirm('Talebi iptal etmek istediğinize emin misiniz?')) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/personnel/advance-requests/${id}/cancel`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'İptal başarısız');
      setSuccess('Talep iptal edildi.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'İptal başarısız');
    } finally {
      setSubmitting(false);
    }
  };

  const awaitingCash = requests.some((r) => r.status === 'awaiting_receipt');

  return (
    <div className="mx-auto max-w-lg px-4 py-4 pb-28">
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/personnel-panel?tab=finance"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm dark:bg-slate-800 dark:text-slate-300"
        >
          <FiArrowLeft />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Avans talebi</h1>
          <p className="text-xs text-slate-500">Onay sonrası ödeme ayrı adımda yapılır</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
          {success}
        </div>
      )}

      {awaitingCash && (
        <Link
          href="/personnel-panel/avans-onay"
          className="mb-4 block rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-4 text-white shadow-lg"
        >
          <p className="font-semibold">Nakit avans teslimi bekleniyor</p>
          <p className="mt-1 text-sm text-white/90">Parayı aldıysanız QR okutun veya kodu girin →</p>
        </Link>
      )}

      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="mb-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-md"
        >
          <FiPlus /> Yeni avans talebi
        </button>
      ) : (
        <form onSubmit={submitRequest} className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Tutar (TL)</label>
          <input
            type="number"
            min="1"
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 dark:border-slate-600 dark:bg-slate-900"
          />
          <label className="mt-3 block text-sm font-medium text-slate-700 dark:text-slate-300">Not (isteğe bağlı)</label>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 dark:border-slate-600 dark:bg-slate-900"
          />
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              Gönder
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm dark:border-slate-600"
            >
              Vazgeç
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="py-12 text-center text-sm text-slate-500">Yükleniyor…</p>
      ) : requests.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">Henüz avans talebiniz yok.</p>
      ) : (
        <ul className="space-y-3">
          {requests.map((row) => (
            <li
              key={row.id}
              className="rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">
                    {formatMoney(row.approved_amount ?? row.requested_amount)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {dayjs(row.requested_at).format('DD MMM YYYY')}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                  {ADVANCE_STATUS_LABELS[row.status]}
                </span>
              </div>
              {row.employee_note && (
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{row.employee_note}</p>
              )}
              {row.rejection_reason && (
                <p className="mt-2 text-sm text-red-600">{row.rejection_reason}</p>
              )}
              {canCancelAdvance(row.status) && (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void cancelRequest(row.id)}
                  className="mt-3 inline-flex items-center gap-1 text-sm text-red-500"
                >
                  <FiXCircle /> İptal et
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
