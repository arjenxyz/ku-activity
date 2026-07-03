'use client';

import { Suspense, useState, FormEvent, ChangeEvent, useEffect, type Dispatch, type SetStateAction } from 'react';
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
      setErrorMessage('Bu hesabın yönetici yetkisi yok veya profil kaydı eksik.');
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
        throw new Error('Bu hesap yönetici olarak tanımlı değil. seed_admin.sql adımlarını kontrol edin.');
      }

      if (!data.session) throw new Error('Oturum oluşturulamadı');

      router.replace('/admin-panel');
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Giriş başarısız';
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
        redirectTo: `${window.location.origin}/admin-panel/login`,
      });
      if (error) throw error;
      showMessage(setSuccessMessage, 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'İşlem başarısız';
      showMessage(setErrorMessage, msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      variant="admin"
      alternateLogin={{ href: '/personnel-panel/login', label: 'Personel Girişi' }}
    >
      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          {activeTab === 'login' ? 'Yönetici Girişi' : 'Şifremi Unuttum'}
        </h2>
        <p className="mt-1 text-sm text-slate-500 leading-relaxed">
          {activeTab === 'login'
            ? 'Hesabınız yoksa ücretsiz kayıt olun'
            : 'Kayıtlı e-posta adresinize sıfırlama bağlantısı gönderilir'}
        </p>
        {activeTab === 'login' && (
          <p className="mt-2 text-xs text-blue-600">
            <Link href="/admin-panel/register" className="font-semibold hover:underline">
              Yönetici hesabı oluştur →
            </Link>
            {' · '}
            <a href={verificationCodeMailto()} className="hover:underline">
              Doğrulama kodu talep et
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
              E-posta
            </label>
            <input
              id="admin-email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              className={inputClass}
              required
              {...loginEmailInputProps}
            />
          </div>
          <div>
            <label htmlFor="admin-password" className={labelClass}>
              Şifre
            </label>
            <input
              id="admin-password"
              placeholder="Şifreniz"
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
                Giriş yapılıyor...
              </>
            ) : (
              'Giriş Yap'
            )}
          </button>
          <div className="text-center">
            <button type="button" onClick={() => setActiveTab('reset')} className={linkButtonClass}>
              Şifremi unuttum
            </button>
          </div>
        </form>
      ) : (
        <form className="space-y-5" onSubmit={handleReset} {...credentialLoginFormProps}>
          <div>
            <label htmlFor="reset-email" className={labelClass}>
              E-posta
            </label>
            <input
              id="reset-email"
              placeholder="admin@example.com"
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
                Gönderiliyor...
              </>
            ) : (
              'Sıfırlama Bağlantısı Gönder'
            )}
          </button>
          <div className="text-center">
            <button type="button" onClick={() => setActiveTab('login')} className={linkButtonClass}>
              Giriş sayfasına dön
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}

export default function AdminAuthPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] flex items-center justify-center text-slate-500">Yükleniyor…</div>}>
      <AdminAuthContent />
    </Suspense>
  );
}
