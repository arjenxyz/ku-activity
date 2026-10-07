'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrandMark } from '@/components/brand/BrandMark';
import { APP_NAME, APP_TAGLINE_TR } from '@/lib/brand';
import { createClient } from '@/utils/supabase/client';
import { homePathForRole, isAppRole } from '@/lib/auth/roles';
import { inputClass, labelClass, primaryButtonClass } from '@/components/auth/authStyles';
import { cardClass } from '@/components/ui/styles';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: signError } = await supabase.auth.signInWithPassword({ email, password });
      if (signError) {
        setError(signError.message);
        return;
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError('Oturum açılamadı');
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_active')
        .eq('id', user.id)
        .maybeSingle();
      if (!profile?.is_active || !isAppRole(profile.role)) {
        setError('Profil bulunamadı veya pasif');
        await supabase.auth.signOut();
        return;
      }
      router.replace(homePathForRole(profile.role));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-4 py-10">
        <div className={`${cardClass} p-6 sm:p-8`}>
          <div className="mb-6 flex flex-col items-center text-center">
            <BrandMark size="lg" className="mb-3 ring-2 ring-[#0E1548]/10" />
            <h1 className="text-lg font-bold text-[#0E1548]">{APP_NAME}</h1>
            <p className="mt-1 text-xs text-slate-500">{APP_TAGLINE_TR}</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className={labelClass}>
                E-posta
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className={labelClass}>
                Şifre
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error ? (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {error}
              </p>
            ) : null}
            <button type="submit" className={primaryButtonClass} disabled={loading}>
              {loading ? 'Giriş yapılıyor…' : 'Giriş yap'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
