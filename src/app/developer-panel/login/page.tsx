'use client';

import { Suspense, useState, useEffect, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { AuthAlert, LoadingSpinner } from '@/components/auth/AuthAlerts';
import { inputClass, labelClass } from '@/components/auth/authStyles';
import {
  credentialLoginFormProps,
  loginEmailInputProps,
  loginPasswordInputProps,
} from '@/components/auth/loginFormProps';

type Tab = 'login' | 'reset';

function DeveloperLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('error') === 'yetkisiz') {
      setError('Bu hesabın developer yetkisi yok. Yönetici (admin) hesabı developer paneline giremez; owner veya developer rolü gerekir.');
    }
  }, [searchParams]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      const { data: isDeveloper, error: rpcError } = await supabase.rpc('is_developer');
      if (rpcError || !isDeveloper) {
        await supabase.auth.signOut();
        throw new Error(
          'Bu e-posta ile giriş başarılı ama developer yetkisi yok. Muhtemelen yönetici (admin) hesabı kullanıyorsunuz — Supabase\'te role değerini owner yapın veya ayrı developer hesabının şifresini kullanın.'
        );
      }

      router.replace('/developer-panel');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/developer-panel/login`,
      });
      if (resetError) throw resetError;
      setSuccess('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlem başarısız');
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
          <p className="text-sm text-slate-400 mt-2">
            {activeTab === 'login' ? 'Doğrulama kodu ve APK yönetimi' : 'Developer hesabı şifre sıfırlama'}
          </p>
        </div>

        <div className="mb-4 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-xs leading-relaxed text-slate-400">
          Yönetici paneli şifresi ile aynı olmak zorunda değil. <strong className="text-slate-300">admin</strong>{' '}
          rolü developer paneline girmez; <strong className="text-slate-300">owner</strong> veya{' '}
          <strong className="text-slate-300">developer</strong> rolü gerekir.
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          {success && <AuthAlert message={success} type="success" />}
          {error && <AuthAlert message={error} type="error" />}

          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4" {...credentialLoginFormProps}>
              <div>
                <label htmlFor="dev-email" className={`${labelClass} text-slate-300`}>
                  E-posta
                </label>
                <input
                  id="dev-email"
                  className={`${inputClass} bg-slate-950 border-slate-700 text-white`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  {...loginEmailInputProps}
                />
              </div>
              <div>
                <label htmlFor="dev-password" className={`${labelClass} text-slate-300`}>
                  Şifre
                </label>
                <input
                  id="dev-password"
                  className={`${inputClass} bg-slate-950 border-slate-700 text-white`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  {...loginPasswordInputProps}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <LoadingSpinner /> Giriş…
                  </>
                ) : (
                  'Giriş Yap'
                )}
              </button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('reset');
                    setError('');
                    setSuccess('');
                    setResetEmail(email);
                  }}
                  className="text-sm text-violet-300 hover:text-violet-200"
                >
                  Şifremi unuttum
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-4" {...credentialLoginFormProps}>
              <div>
                <label htmlFor="dev-reset-email" className={`${labelClass} text-slate-300`}>
                  Developer e-postası
                </label>
                <input
                  id="dev-reset-email"
                  className={`${inputClass} bg-slate-950 border-slate-700 text-white`}
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  {...loginEmailInputProps}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <LoadingSpinner /> Gönderiliyor…
                  </>
                ) : (
                  'Sıfırlama Bağlantısı Gönder'
                )}
              </button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setError('');
                    setSuccess('');
                  }}
                  className="text-sm text-violet-300 hover:text-violet-200"
                >
                  Giriş sayfasına dön
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-300">
            Ana sayfa
          </Link>
          {' · '}
          <Link href="/admin-panel/login" className="hover:text-slate-300">
            Yönetici girişi
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function DeveloperLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] flex items-center justify-center text-slate-500">Yükleniyor…</div>}>
      <DeveloperLoginContent />
    </Suspense>
  );
}
