'use client';


import { Suspense, useState, FormEvent, ChangeEvent, useEffect, type Dispatch, type SetStateAction } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthAlert, LoadingSpinner } from '@/components/auth/AuthAlerts';
import {
  personnelAuthInputClass as inputClass,
  personnelAuthLabelClass as labelClass,
  personnelAuthPrimaryBtnClass as primaryButtonClass,
  personnelAuthLinkClass as linkButtonClass,
  personnelAuthCardDividerClass,
} from '@/lib/personnel-auth-ui';
import { verificationCodeMailto } from '@/lib/support-email';
import Link from 'next/link';
import {
  credentialLoginFormProps,
  loginEmailInputProps,
  loginPasswordInputProps,
} from '@/components/auth/loginFormProps';

type Tab = 'login' | 'reset';

function AdminAuthContent() {
  const strings = useRegistryStrings('app/admin-panel/login/page');

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('error') === 'yetkisiz') {
      setErrorMessage(strings.unauthorizedError);
    }
  }, [searchParams]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/admin-panel');
    });
  }, [router, supabase.auth]);

  const showMessage = (setter: Dispatch<SetStateAction<string>>, msg: string) => {
    setter(msg);
    setTimeout(() => setter(''), 8000);
  };

  const handleLogin = async (e: FormEvent) => {

    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const { data: isAdmin, error: rpcError } = await supabase.rpc('is_admin');
      if (rpcError || !isAdmin) {
        await supabase.auth.signOut();
        throw new Error(strings.notAdminError);
      }

      if (!data.session) throw new Error(strings.sessionFailed);

      router.replace('/admin-panel');
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : strings.loginFailed;
      showMessage(setErrorMessage, msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (e: FormEvent) => {

    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/auth/yeni-sifre?panel=admin')}`,
      });
      if (error) throw error;
      showMessage(setSuccessMessage, strings.resetSent);
    } catch (err) {
      const msg = err instanceof Error ? err.message : strings.operationFailed;
      showMessage(setErrorMessage, msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      variant="admin"
      alternateLogin={{ href: '/personnel-panel/login', label: strings.personnelLogin }}
    >
      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          {activeTab === 'login' ? strings.loginTitle : strings.resetTitle}
        </h2>
        <p className="mt-1 text-sm text-slate-500 leading-relaxed">
          {activeTab === 'login' ? strings.loginSubtitle : strings.resetSubtitle}
        </p>
        {activeTab === 'login' && (
          <p className="mt-2 text-xs text-blue-600">
            <Link href="/admin-panel/register" className="font-semibold hover:underline">
              {strings.createAccountLink}
            </Link>
            {' · '}
            <a href={verificationCodeMailto()} className="hover:underline">
              {strings.requestVerificationCode}
            </a>
          </p>
        )}
        <div className={personnelAuthCardDividerClass} />
      </div>

      {successMessage && <AuthAlert message={successMessage} type="success" tone="personnel" />}
      {errorMessage && <AuthAlert message={errorMessage} type="error" tone="personnel" />}

      {activeTab === 'login' ? (
        <form className="space-y-5" onSubmit={handleLogin} {...credentialLoginFormProps}>
          <div>
            <label htmlFor="admin-email" className={labelClass}>
              {strings.emailLabel}
            </label>
            <input
              id="admin-email"
              placeholder={strings.emailPlaceholder}
              value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              className={inputClass}
              required
              {...loginEmailInputProps}
            />
          </div>
          <div>
            <label htmlFor="admin-password" className={labelClass}>
              {strings.passwordLabel}
            </label>
            <input
              id="admin-password"
              placeholder={strings.passwordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              required
              {...loginPasswordInputProps}
            />
          </div>
          <button type="submit" disabled={isLoading} className={primaryButtonClass}>
            {isLoading ? (
              <>
                <LoadingSpinner />
                {strings.loggingIn}
              </>
            ) : (
              strings.loginButton
            )}
          </button>
          <div className="text-center">
            <button type="button" onClick={() => setActiveTab('reset')} className={linkButtonClass}>
              {strings.forgotPassword}
            </button>
          </div>
        </form>
      ) : (
        <form className="space-y-5" onSubmit={handleReset} {...credentialLoginFormProps}>
          <div>
            <label htmlFor="reset-email" className={labelClass}>
              {strings.emailLabel}
            </label>
            <input
              id="reset-email"
              placeholder={strings.emailPlaceholder}
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className={inputClass}
              required
              {...loginEmailInputProps}
            />
          </div>
          <button type="submit" disabled={isLoading} className={primaryButtonClass}>
            {isLoading ? (
              <>
                <LoadingSpinner />
                {strings.sending}
              </>
            ) : (
              strings.sendResetLink
            )}
          </button>
          <div className="text-center">
            <button type="button" onClick={() => setActiveTab('login')} className={linkButtonClass}>
              {strings.backToLogin}
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}

export default function AdminAuthPage() {

  const strings = useRegistryStrings('app/admin-panel/login/page');
  return (
    <Suspense fallback={<div className="min-h-[100dvh] flex items-center justify-center text-slate-500">{strings.loading}</div>}>
      <AdminAuthContent />
    </Suspense>
  );
}
