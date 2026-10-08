'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrandMark } from '@/components/brand/BrandMark';
import { APP_NAME, APP_TAGLINE } from '@/lib/brand';
import { createClient } from '@/utils/supabase/client';
import { homePathForRole, isAppRole, type AppRole } from '@/lib/auth/roles';
import { DEMO_ACCOUNTS, DEMO_PASSWORD, findDemoAccount } from '@/lib/demo/accounts';
import { findSignup, passwordOverride, savePasswordOverride, saveSignup } from '@/lib/demo/local-accounts';
import { DEMO_RESET_CODE, isResetCode } from '@/lib/demo/reset-code';
import { inputClass, labelClass, linkButtonClass, primaryButtonClass } from '@/components/auth/authStyles';
import { btnSecondary, cardClass } from '@/components/ui/styles';

type Panel = 'login' | 'register' | 'forgot';

export default function LoginPage() {
  const router = useRouter();
  const [panel, setPanel] = useState<Panel>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [studentNo, setStudentNo] = useState('');
  const [confirm, setConfirm] = useState('');
  const [code, setCode] = useState('');
  const [codeOk, setCodeOk] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function openPanel(next: Panel) {
    setPanel(next);
    setError(null);
    setNotice(null);
    setCodeOk(false);
    setCode('');
    setConfirm('');
  }

  async function enterDemo(nextEmail: string, nextPassword: string) {
    const response = await fetch('/api/demo/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: nextEmail, password: nextPassword }),
    });
    const payload = (await response.json().catch(() => null)) as { role?: string; error?: string } | null;
    if (!response.ok || !isAppRole(payload?.role)) {
      setError(payload?.error ?? 'Demo girişi başarısız');
      return false;
    }
    router.replace(homePathForRole(payload.role));
    router.refresh();
    return true;
  }

  async function enterAs(role: AppRole, accountEmail: string) {
    const builtin = DEMO_ACCOUNTS.find((account) => account.role === role) ?? DEMO_ACCOUNTS[2];
    const ok = await enterDemo(accountEmail === builtin.email ? accountEmail : builtin.email, DEMO_PASSWORD);
    return ok;
  }

  async function onLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const key = email.trim().toLowerCase();
      const override = passwordOverride(key);
      if (override) {
        if (password !== override) {
          setError('Şifre hatalı');
          return;
        }
        const builtin = DEMO_ACCOUNTS.find((account) => account.email === key);
        await enterAs(builtin?.role ?? 'student', builtin?.email ?? key);
        return;
      }

      if (findSignup(key, password)) {
        await enterAs('student', key);
        return;
      }

      if (findDemoAccount(email, password)) {
        await enterDemo(email, password);
        return;
      }

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

  function onRegister(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Şifre en az 8 karakter olmalı');
      return;
    }
    if (password !== confirm) {
      setError('Şifreler aynı değil');
      return;
    }
    const key = email.trim().toLowerCase();
    if (DEMO_ACCOUNTS.some((account) => account.email === key)) {
      setError('Bu e-posta demo hesaplarda kayıtlı');
      return;
    }
    saveSignup({ email: key, password, fullName: fullName.trim(), studentNo: studentNo.trim() });
    setPassword('');
    setConfirm('');
    setNotice('Kayıt alındı. Yeni şifrenle giriş yapabilirsin.');
    setPanel('login');
  }

  function onCheckCode(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError('E-posta gerekli');
      return;
    }
    if (!isResetCode(code)) {
      setError('Kod geçersiz. Yönetici kodunu veya QR içeriğini gir.');
      return;
    }
    setCodeOk(true);
  }

  function onResetPassword(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Şifre en az 8 karakter olmalı');
      return;
    }
    if (password !== confirm) {
      setError('Şifreler aynı değil');
      return;
    }
    savePasswordOverride(email, password);
    setPassword('');
    setConfirm('');
    setNotice('Şifre yenilendi. Yeni şifrenle giriş yap.');
    openPanel('login');
  }

  const title =
    panel === 'register' ? 'Kayıt ol' : panel === 'forgot' ? 'Şifremi unuttum' : 'Giriş yap';

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-4 py-10 lg:max-w-lg">
        <div className={`${cardClass} p-6 sm:p-8`}>
          <div className="mb-6 flex flex-col items-center text-center">
            <BrandMark size="lg" className="mb-3 ring-2 ring-[#0E1548]/10" />
            <h1 className="text-lg font-bold text-[#0E1548]">{APP_NAME}</h1>
            <p className="mt-1 text-xs text-slate-500">{APP_TAGLINE}</p>
            <p className="mt-3 text-sm font-semibold text-slate-800">{title}</p>
          </div>

          {notice ? (
            <p className="mb-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800" role="status">
              {notice}
            </p>
          ) : null}

          {panel === 'login' ? (
            <form onSubmit={onLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className={labelClass}>E-posta</label>
                <input id="email" type="email" autoComplete="email" required className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <label htmlFor="password" className="text-sm font-medium text-gray-700">Şifre</label>
                  <button type="button" className={linkButtonClass} onClick={() => openPanel('forgot')}>
                    Şifremi unuttum
                  </button>
                </div>
                <input id="password" type="password" autoComplete="current-password" required className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p> : null}
              <button type="submit" className={primaryButtonClass} disabled={loading}>
                {loading ? 'Giriş yapılıyor…' : 'Giriş yap'}
              </button>
              <p className="text-center text-sm text-slate-600">
                Hesabın yok mu?{' '}
                <button type="button" className={linkButtonClass} onClick={() => openPanel('register')}>
                  Kayıt ol
                </button>
              </p>
            </form>
          ) : null}

          {panel === 'register' ? (
            <form onSubmit={onRegister} className="space-y-4">
              <div>
                <label htmlFor="fullName" className={labelClass}>Ad soyad</label>
                <input id="fullName" required className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div>
                <label htmlFor="studentNo" className={labelClass}>Öğrenci no</label>
                <input id="studentNo" required className={inputClass} value={studentNo} onChange={(e) => setStudentNo(e.target.value)} />
              </div>
              <div>
                <label htmlFor="regEmail" className={labelClass}>E-posta</label>
                <input id="regEmail" type="email" required className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <label htmlFor="regPassword" className={labelClass}>Şifre</label>
                <input id="regPassword" type="password" required className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div>
                <label htmlFor="regConfirm" className={labelClass}>Şifre tekrar</label>
                <input id="regConfirm" type="password" required className={inputClass} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              </div>
              {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p> : null}
              <button type="submit" className={primaryButtonClass}>Kaydı tamamla</button>
              <p className="text-center text-sm text-slate-600">
                Zaten hesabın var mı?{' '}
                <button type="button" className={linkButtonClass} onClick={() => openPanel('login')}>Giriş yap</button>
              </p>
            </form>
          ) : null}

          {panel === 'forgot' ? (
            <div className="space-y-4">
              <p className="rounded-xl bg-slate-50 px-3 py-3 text-sm leading-relaxed text-slate-600">
                Şifreyi buradan kendi başına sıfırlayamazsın. Yöneticine başvur. Sana bir kod veya bu kodu taşıyan bir QR verir. Kodu girince yeni şifreni oluşturursun.
              </p>
              {!codeOk ? (
                <form onSubmit={onCheckCode} className="space-y-4">
                  <div>
                    <label htmlFor="resetEmail" className={labelClass}>E-posta</label>
                    <input id="resetEmail" type="email" required className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="resetCode" className={labelClass}>Yönetici kodu</label>
                    <input id="resetCode" required className={inputClass} value={code} onChange={(e) => setCode(e.target.value)} placeholder="QR içindeki kod" autoComplete="one-time-code" />
                    <p className="mt-1 text-xs text-slate-500">Örnek kod: {DEMO_RESET_CODE}</p>
                  </div>
                  {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p> : null}
                  <button type="submit" className={primaryButtonClass}>Kodu doğrula</button>
                </form>
              ) : (
                <form onSubmit={onResetPassword} className="space-y-4">
                  <div>
                    <label htmlFor="newPassword" className={labelClass}>Yeni şifre</label>
                    <input id="newPassword" type="password" required className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="newConfirm" className={labelClass}>Yeni şifre tekrar</label>
                    <input id="newConfirm" type="password" required className={inputClass} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                  </div>
                  {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p> : null}
                  <button type="submit" className={primaryButtonClass}>Şifreyi kaydet ve girişe dön</button>
                </form>
              )}
              <p className="text-center text-sm">
                <button type="button" className={linkButtonClass} onClick={() => openPanel('login')}>Girişe dön</button>
              </p>
            </div>
          ) : null}

          {panel === 'login' ? (
            <div className="mt-6 border-t border-slate-100 pt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Demo giriş</p>
              <p className="mt-1 text-xs text-slate-500">Şifre hepsi için Demo1234. Veriler örnektir.</p>
              <div className="mt-3 space-y-2">
                {DEMO_ACCOUNTS.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    className={`${btnSecondary} w-full justify-between`}
                    disabled={loading}
                    onClick={() => {
                      setEmail(account.email);
                      setPassword(account.password);
                      setError(null);
                      setLoading(true);
                      void enterDemo(account.email, account.password).finally(() => setLoading(false));
                    }}
                  >
                    <span>{account.label}</span>
                    <span className="truncate text-xs font-normal text-slate-500">{account.email}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
