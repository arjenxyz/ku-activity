'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { AuthAlert, LoadingSpinner } from '@/components/auth/AuthAlerts';
import { inputClass, labelClass } from '@/components/auth/authStyles';
import {
  noAutofillFormProps,
  noAutofillEmailProps,
  noAutofillPasswordProps,
} from '@/components/auth/noAutofill';

export default function DeveloperLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('error') === 'yetkisiz') {
      setError('Bu hesabın developer yetkisi yok.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      const { data: isDeveloper, error: rpcError } = await supabase.rpc('is_developer');
      if (rpcError || !isDeveloper) {
        await supabase.auth.signOut();
        throw new Error('Developer yetkisi gerekli. seed_developer.sql ile profil oluşturun.');
      }

      router.replace('/developer-panel');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 items-center justify-center text-white font-bold text-lg mb-4">
            D
          </div>
          <h1 className="text-2xl font-bold text-white">Developer Girişi</h1>
          <p className="text-sm text-slate-400 mt-2">Doğrulama kodu yönetimi</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4" {...noAutofillFormProps}>
          <div>
            <label htmlFor="dev-email" className={`${labelClass} text-slate-300`}>E-posta</label>
            <input id="dev-email" type="email" className={`${inputClass} bg-slate-950 border-slate-700 text-white`} value={email} onChange={(e) => setEmail(e.target.value)} required {...noAutofillEmailProps} />
          </div>
          <div>
            <label htmlFor="dev-password" className={`${labelClass} text-slate-300`}>Şifre</label>
            <input id="dev-password" type="password" className={`${inputClass} bg-slate-950 border-slate-700 text-white`} value={password} onChange={(e) => setPassword(e.target.value)} required {...noAutofillPasswordProps} />
          </div>
          {error && <AuthAlert message={error} type="error" />}
          <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2">
            {loading ? <><LoadingSpinner /> Giriş…</> : 'Giriş Yap'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-300">Ana sayfa</Link>
        </p>
      </div>
    </div>
  );
}
