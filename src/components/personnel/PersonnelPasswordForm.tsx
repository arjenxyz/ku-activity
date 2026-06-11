'use client';

import { useState } from 'react';
import { FiLock } from 'react-icons/fi';
import { changePersonnelPassword } from '@/lib/personnel-api';

export function PersonnelPasswordForm() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (next !== confirm) {
      setError('Yeni şifreler eşleşmiyor');
      return;
    }
    setLoading(true);
    try {
      await changePersonnelPassword(current, next);
      setSuccess(true);
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Güncelleme başarısız');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'block w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500';

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-4 sm:p-6 space-y-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <FiLock className="w-5 h-5 text-blue-600" />
        <h2 className="font-semibold text-gray-900 dark:text-white">Şifre Değiştir</h2>
      </div>
      <p className="text-xs text-gray-500">Personel paneli giriş şifrenizi güncelleyin (4-12 karakter).</p>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Mevcut şifre
        </label>
        <input
          type="password"
          className={inputClass}
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Yeni şifre
        </label>
        <input
          type="password"
          className={inputClass}
          value={next}
          onChange={(e) => setNext(e.target.value)}
          required
          minLength={4}
          maxLength={12}
          autoComplete="new-password"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Yeni şifre (tekrar)
        </label>
        <input
          type="password"
          className={inputClass}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={4}
          maxLength={12}
          autoComplete="new-password"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2">{error}</p>
      )}
      {success && (
        <p className="text-sm text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg px-3 py-2">
          Şifreniz güncellendi.
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50"
      >
        {loading ? 'Kaydediliyor…' : 'Şifreyi Güncelle'}
      </button>
    </form>
  );
}
