'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiLock } from 'react-icons/fi';
import { PersonnelLoginLayout } from '@/components/personnel/PersonnelLoginLayout';
import { AuthAlert, LoadingSpinner } from '@/components/auth/AuthAlerts';
import { AutofillTrap } from '@/components/auth/AutofillTrap';
import {
  noAutofillFormProps,
  noAutofillEmailProps,
  noAutofillPasswordProps,
} from '@/components/auth/noAutofill';

const inputClass =
  'block w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow';

const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';

export default function PersonnelLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/personnel/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Giriş başarısız (${res.status})`);
        return;
      }
      router.push('/personnel-panel');
      router.refresh();
    } catch {
      setError('Sistem hatası — lütfen tekrar deneyin');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PersonnelLoginLayout>
      <form onSubmit={handleLogin} className="space-y-5 relative" {...noAutofillFormProps}>
        <AutofillTrap />

        <div>
          <label htmlFor="personnel-email" className={labelClass}>
            E-posta
          </label>
          <input
            id="personnel-email"
            name="personnel-email"
            type="email"
            className={inputClass}
            placeholder="ornek@firma.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            {...noAutofillEmailProps}
          />
        </div>

        <div>
          <label htmlFor="personnel-password" className={labelClass}>
            Şifre
          </label>
          <input
            id="personnel-password"
            name="personnel-password"
            type="password"
            className={inputClass}
            placeholder="Şifreniz"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            {...noAutofillPasswordProps}
          />
        </div>

        {error && <AuthAlert message={error} type="error" />}

        <button
          type="submit"
          disabled={isLoading || !email || !password}
          className="touch-target w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white px-6 py-3.5 rounded-xl font-semibold shadow-lg shadow-blue-500/25 transition-all"
        >
          {isLoading ? (
            <>
              <LoadingSpinner />
              Giriş yapılıyor…
            </>
          ) : (
            <>
              <FiLock className="w-4 h-4" />
              Giriş Yap
            </>
          )}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
        Henüz kayıtlı değil misiniz?{' '}
        <Link
          href="/personnel-panel/basvuru"
          prefetch
          className="text-blue-600 font-semibold hover:underline"
        >
          Başvuru yapın
        </Link>
      </p>
    </PersonnelLoginLayout>
  );
}
