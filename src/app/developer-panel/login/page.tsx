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
import strings from '@json/src/app/developer-panel/login/page.json';

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
      setError(strings.unauthorizedFromQuery);
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
        throw new Error(strings.loginSuccessNoDeveloperRole);
      }

      router.replace('/developer-panel');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.loginFailed);
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
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/auth/yeni-sifre?panel=developer')}`,
      });
      if (resetError) throw resetError;
      setSuccess(strings.resetEmailSent);
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.operationFailed);
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
          <h1 className="text-2xl font-bold text-white">{strings.title}</h1>
          <p className="text-sm text-slate-400 mt-2">
            {activeTab === 'login' ? strings.subtitleLogin : strings.subtitleReset}
          </p>
        </div>

        <div className="mb-4 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-xs leading-relaxed text-slate-400">
          {strings.roleHintIntro} <strong className="text-slate-300">admin</strong> {strings.roleHintMid}{' '}
          <strong className="text-slate-300">owner</strong> {strings.roleHintConjunction}{' '}
          <strong className="text-slate-300">developer</strong> {strings.roleHintRequired}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          {success && <AuthAlert message={success} type="success" />}
          {error && <AuthAlert message={error} type="error" />}

          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4" {...credentialLoginFormProps}>
              <div>
                <label htmlFor="dev-email" className={`${labelClass} text-slate-300`}>
                  {strings.emailLabel}
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
                  {strings.passwordLabel}
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
                    <LoadingSpinner /> {strings.loggingIn}
                  </>
                ) : (
                  strings.loginButton
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
                  {strings.forgotPassword}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-4" {...credentialLoginFormProps}>
              <div>
                <label htmlFor="dev-reset-email" className={`${labelClass} text-slate-300`}>
                  {strings.developerEmailLabel}
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
                    <LoadingSpinner /> {strings.sendingReset}
                  </>
                ) : (
                  strings.sendResetLink
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
                  {strings.backToLogin}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-300">
            {strings.homeLink}
          </Link>
          {' · '}
          <Link href="/admin-panel/login" className="hover:text-slate-300">
            {strings.adminLoginLink}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function DeveloperLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] flex items-center justify-center text-slate-500">{strings.loading}</div>}>
      <DeveloperLoginContent />
    </Suspense>
  );
}
