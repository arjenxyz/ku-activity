'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiUserPlus } from 'react-icons/fi';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthAlert, LoadingSpinner } from '@/components/auth/AuthAlerts';
import { inputClass, labelClass, primaryButtonClass } from '@/components/auth/authStyles';
import {
  credentialLoginFormProps,
  loginEmailInputProps,
  registerPasswordInputProps,
} from '@/components/auth/loginFormProps';
import { createClient } from '@/utils/supabase/client';
import { verificationCodeMailto } from '@/lib/support-email';

export default function AdminRegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/admin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Kayıt başarısız');
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        router.push('/admin-panel/login?registered=1');
        return;
      }

      router.replace('/admin-panel');
      router.refresh();
    } catch {
      setError('Kayıt sırasında hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      variant="admin"
      alternateLogin={{ href: '/admin-panel/login', label: 'Giriş Yap' }}
    >
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 text-center">
        Yönetici Hesabı Oluştur
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
        Ücretsiz hesap açın. Proje oluşturmak için doğrulama kodu gerekir.
      </p>
      <p className="text-xs text-center text-blue-600 dark:text-blue-400 mb-6">
        <a href={verificationCodeMailto()} className="font-medium hover:underline">
          Doğrulama kodu için bize e-posta gönderin →
        </a>
      </p>

      <form onSubmit={handleSubmit} className="space-y-4" {...credentialLoginFormProps}>
        <div>
          <label htmlFor="reg-name" className={labelClass}>Ad Soyad *</label>
          <input id="reg-name" className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="name" />
        </div>
        <div>
          <label htmlFor="reg-email" className={labelClass}>E-posta *</label>
          <input id="reg-email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} required {...loginEmailInputProps} />
        </div>
        <div>
          <label htmlFor="reg-phone" className={labelClass}>Telefon</label>
          <input id="reg-phone" type="tel" className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
        </div>
        <div>
          <label htmlFor="reg-password" className={labelClass}>Şifre *</label>
          <input id="reg-password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} {...registerPasswordInputProps} />
          <p className="text-xs text-gray-500 mt-1">En az 6 karakter</p>
        </div>

        {error && <AuthAlert message={error} type="error" />}

        <button type="submit" disabled={isLoading} className={primaryButtonClass}>
          {isLoading ? (
            <>
              <LoadingSpinner />
              Hesap oluşturuluyor…
            </>
          ) : (
            <>
              <FiUserPlus className="w-4 h-4" />
              Hesap Oluştur
            </>
          )}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-gray-500">
        Zaten hesabınız var mı?{' '}
        <Link href="/admin-panel/login" className="text-blue-600 font-medium hover:underline">
          Giriş yapın
        </Link>
      </p>
    </AuthLayout>
  );
}
