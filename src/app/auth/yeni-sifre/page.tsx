'use client';

import { Suspense, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { AuthAlert, LoadingSpinner } from '@/components/auth/AuthAlerts';
import { inputClass, labelClass } from '@/components/auth/authStyles';
import { loginPasswordInputProps } from '@/components/auth/loginFormProps';
import strings from '@json/src/app/auth/yeni-sifre/page.json';
import { formatString } from '@/lib/strings/format';

function NewPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const panel = searchParams.get('panel') === 'developer' ? 'developer' : 'admin';
  const linkError = searchParams.get('error') === 'link';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(linkError ? strings.linkInvalidOrExpired : '');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionReady(Boolean(session));
      setChecking(false);
      if (!session && !linkError) {
        setError(strings.sessionNotFound);
      }
    });
  }, [supabase.auth, linkError]);

  const loginHref = panel === 'developer' ? '/developer-panel/login' : '/admin-panel/login';
  const panelLabel = panel === 'developer' ? strings.developerPanelLabel : strings.adminPanelLabel;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError(strings.passwordMinLength);
      return;
    }
    if (password !== confirm) {
      setError(strings.passwordMismatch);
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      await supabase.auth.signOut();
      setSuccess(true);
      window.setTimeout(() => router.replace(loginHref), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.passwordUpdateFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 items-center justify-center text-white font-bold text-lg mb-4">
            🔒
          </div>
          <h1 className="text-2xl font-bold text-white">{strings.title}</h1>
          <p className="text-sm text-slate-400 mt-2">{formatString(strings.subtitleForPanel, { panelLabel })}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          {success ? (
            <AuthAlert
              type="success"
              message={formatString(strings.passwordUpdatedRedirect, { panelLabel })}
            />
          ) : checking ? (
            <p className="text-sm text-slate-400 text-center py-4">{strings.checkingSession}</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <AuthAlert message={error} type="error" />}
              {!sessionReady && !error && (
                <AuthAlert message={strings.invalidLinkRetry} type="error" />
              )}
              <div>
                <label htmlFor="new-password" className={`${labelClass} text-slate-300`}>
                  {strings.newPasswordLabel}
                </label>
                <input
                  id="new-password"
                  className={`${inputClass} bg-slate-950 border-slate-700 text-white`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={!sessionReady || loading}
                  {...loginPasswordInputProps}
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className={`${labelClass} text-slate-300`}>
                  {strings.confirmPasswordLabel}
                </label>
                <input
                  id="confirm-password"
                  className={`${inputClass} bg-slate-950 border-slate-700 text-white`}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={6}
                  disabled={!sessionReady || loading}
                  {...loginPasswordInputProps}
                />
              </div>
              <button
                type="submit"
                disabled={!sessionReady || loading}
                className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <LoadingSpinner /> {strings.saving}
                  </>
                ) : (
                  strings.savePassword
                )}
              </button>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-sm text-slate-500">
          <Link href={loginHref} className="hover:text-slate-300">
            {strings.backToLogin}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function NewPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] flex items-center justify-center text-slate-500">{strings.loading}</div>}>
      <NewPasswordForm />
    </Suspense>
  );
}
