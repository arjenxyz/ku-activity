'use client';

import { FormEvent, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { FiInfo, FiX } from 'react-icons/fi';
import { BrandMark } from '@/components/brand/BrandMark';
import { APP_NAME, APP_TAGLINE } from '@/lib/brand';
import { createClient } from '@/utils/supabase/client';
import { homePathForRole, isAppRole, type AppRole } from '@/lib/auth/roles';
import { DEMO_ACCOUNTS, DEMO_PASSWORD, findDemoAccount } from '@/lib/demo/accounts';
import { findSignup, findSignupByEmail, passwordOverride, savePasswordOverride, saveSignup, type LocalSignup } from '@/lib/demo/local-accounts';
import { isResetCode } from '@/lib/demo/reset-code';
import { inputClass, labelClass, linkButtonClass, primaryButtonClass } from '@/components/auth/authStyles';
import { ResetCodeField } from '@/components/auth/ResetCodeField';
import { btnSecondary, cardClass } from '@/components/ui/styles';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { classOptions, FACULTY_DEPARTMENTS } from '@/lib/faculty';

type Panel = 'login' | 'register' | 'pending';

export default function LoginPage() {
  const router = useRouter();
  const [panel, setPanel] = useState<Panel>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [studentNo, setStudentNo] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [classYear, setClassYear] = useState('');
  const [confirm, setConfirm] = useState('');
  const [code, setCode] = useState('');
  const [codeOk, setCodeOk] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<LocalSignup | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [stepsOpen, setStepsOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useBodyScrollLock(forgotOpen || demoOpen);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!demoOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDemoOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [demoOpen]);

  function openPanel(next: Panel) {
    setPanel(next);
    setError(null);
    setNotice(null);
    setCodeOk(false);
    setCode('');
    setConfirm('');
    setFirstName('');
    setLastName('');
    setPhone('');
    setDepartment('');
    setClassYear('');
    setStudentNo('');
  }

  function openForgot() {
    setForgotOpen(true);
    setError(null);
    setCodeOk(false);
    setCode('');
    setConfirm('');
    setPassword('');
  }

  function closeForgot() {
    setForgotOpen(false);
    setStepsOpen(false);
    setError(null);
    setCodeOk(false);
    setCode('');
    setConfirm('');
    setPassword('');
  }

  useEffect(() => {
    if (!forgotOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (stepsOpen) {
        setStepsOpen(false);
        return;
      }
      closeForgot();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [forgotOpen, stepsOpen]);

  useEffect(() => {
    if (panel !== 'pending' || !pending) return;
    const check = () => {
      const current = findSignupByEmail(pending.email);
      if (current?.status === 'approved') {
        setPending(current);
        setNotice('Yönetici onayladı. Yeni şifrenle giriş yapabilirsin.');
        setPanel('login');
      }
    };
    check();
    const timer = window.setInterval(check, 1000);
    window.addEventListener('storage', check);
    window.addEventListener('ems-signups', check);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('storage', check);
      window.removeEventListener('ems-signups', check);
    };
  }, [panel, pending]);

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

      const signup = findSignupByEmail(key);
      if (signup?.status === 'pending') {
        setPending(signup);
        setPanel('pending');
        setError('Kaydın henüz onaylanmadı. Öğrenci kimliğinle yöneticiye git.');
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
    if (!/^\d{9}$/.test(studentNo.trim())) {
      setError('Öğrenci numarası 9 haneli olmalı');
      return;
    }
    const phoneDigits = phone.replace(/\D/g, '');
    const normalizedPhone =
      phoneDigits.length === 12 && phoneDigits.startsWith('90')
        ? `0${phoneDigits.slice(2)}`
        : phoneDigits.length === 10 && phoneDigits.startsWith('5')
          ? `0${phoneDigits}`
          : phoneDigits.length === 11 && phoneDigits.startsWith('05')
            ? phoneDigits
            : null;
    if (!normalizedPhone) {
      setError('Telefon numarası 05xx xxx xx xx biçiminde olmalı');
      return;
    }
    const key = email.trim().toLowerCase();
    if (DEMO_ACCOUNTS.some((account) => account.email === key)) {
      setError('Bu e-posta demo hesaplarda kayıtlı');
      return;
    }
    const record = saveSignup({
      email: key,
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      fullName: `${firstName.trim()} ${lastName.trim()}`,
      studentNo: studentNo.trim(),
      phone: normalizedPhone,
      department,
      classYear,
    });
    setPassword('');
    setConfirm('');
    setPending(record);
    setNotice(null);
    setPanel('pending');
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
    setForgotOpen(false);
    setCodeOk(false);
    setCode('');
    setPanel('login');
  }

  const title =
    panel === 'register' ? 'Kayıt ol' : panel === 'pending' ? 'Onay bekleniyor' : 'Giriş yap';

  const resetSteps = [
    {
      title: 'Ekip sayfasına gir',
      body: (
        <>
          <a href="/ekip" className="font-medium text-[#0E1548] underline">Ekip</a> sayfasından şifre sıfırlama iste.
        </>
      ),
    },
    {
      title: 'Ekiple iletişime geç',
      body: 'Öğrenci kimlik kartını yanında bulundur. Kim olduğunu ekip doğrular.',
    },
    {
      title: 'Kod veya QR al',
      body: 'Ekip sana bir kod verir ya da aynı kodu QR olarak okutur.',
    },
    {
      title: 'Yeni şifreni oluştur',
      body: 'Kodu forma yaz. Doğrulama bitince yeni şifreni belirle.',
    },
  ];

  const forgotModal =
    mounted && forgotOpen
      ? createPortal(
          <>
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="forgot-title"
              className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/70 backdrop-blur-md"
            >
              <div className="flex min-h-full items-center justify-center px-4 py-6">
                <div
                  className={`${cardClass} relative w-full max-w-md p-6 sm:p-8`}
                  data-scroll-lock-allow=""
                  onClick={(event) => event.stopPropagation()}
                >
                  <button
                    type="button"
                    aria-label="Bilgi"
                    aria-haspopup="dialog"
                    aria-expanded={stepsOpen}
                    onClick={() => setStepsOpen(true)}
                    className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[#0E1548] hover:bg-slate-50"
                  >
                    <FiInfo className="h-6 w-6" aria-hidden />
                  </button>
                  <button
                    type="button"
                    aria-label="Kapat"
                    onClick={closeForgot}
                    className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[#0E1548] hover:bg-slate-50"
                  >
                    <FiX className="h-5 w-5" aria-hidden />
                  </button>
                  <div className="mb-5 flex flex-col items-center text-center">
                    <BrandMark size="lg" className="mb-3 ring-2 ring-[#0E1548]/10" />
                    <h2 id="forgot-title" className="text-lg font-bold text-[#0E1548]">{APP_NAME}</h2>
                    <p className="mt-1 text-xs text-slate-500">{APP_TAGLINE}</p>
                    <p className="mt-3 text-sm font-semibold text-slate-800">Şifremi unuttum</p>
                  </div>
                  {!codeOk ? (
                    <form onSubmit={onCheckCode} className="space-y-4">
                      <div>
                        <label htmlFor="resetEmail" className={labelClass}>E-posta</label>
                        <input id="resetEmail" type="email" required className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
                      </div>
                      <div>
                        <label htmlFor="resetCode" className={labelClass}>Yönetici kodu</label>
                        <ResetCodeField id="resetCode" value={code} onChange={setCode} />
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
                </div>
              </div>
            </div>
            {stepsOpen ? (
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="reset-steps-title"
                className="fixed inset-0 z-[110] overflow-y-auto bg-slate-900/70 backdrop-blur-md"
                onClick={() => setStepsOpen(false)}
              >
                <div className="flex min-h-full items-center justify-center px-4 py-6">
                  <section
                    className={`${cardClass} w-full max-w-md p-6 sm:p-8`}
                    data-scroll-lock-allow=""
                    onClick={(event) => event.stopPropagation()}
                  >
                    <p id="reset-steps-title" className="text-center text-sm font-semibold text-slate-800">Nasıl sıfırlanır</p>
                    <ol className="mt-6 flex flex-col gap-5">
                      {resetSteps.map((step, index) => (
                        <li key={step.title} className="flex gap-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0E1548] text-xs font-semibold text-white">
                            {index + 1}
                          </span>
                          <span>
                            <p className="text-sm font-semibold text-[#0E1548]">{step.title}</p>
                            <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{step.body}</p>
                          </span>
                        </li>
                      ))}
                    </ol>
                    <p className="mt-6 text-center text-sm">
                      <button type="button" className={linkButtonClass} onClick={() => setStepsOpen(false)}>Kapat</button>
                    </p>
                  </section>
                </div>
              </div>
            ) : null}
          </>,
          document.body,
        )
      : null;

  return (
    <div className={`flex min-h-[100dvh] flex-col items-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 lg:px-10 ${panel === 'login' ? 'justify-center gap-8 py-6 lg:h-[100dvh] lg:overflow-hidden' : 'overflow-y-auto py-6'}`}>
      <div className={`${cardClass} flex w-full max-w-md flex-col p-6 sm:p-8 ${panel === 'login' ? '' : 'my-auto lg:max-w-3xl'}`}>
          <div className="mb-5 flex flex-col items-center text-center lg:mb-4">
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
                    <button type="button" className={linkButtonClass} aria-haspopup="dialog" aria-expanded={forgotOpen} onClick={openForgot}>
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
              <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className={labelClass}>Ad</label>
                <input id="firstName" autoComplete="given-name" required className={inputClass} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div>
                <label htmlFor="lastName" className={labelClass}>Soyad</label>
                <input id="lastName" autoComplete="family-name" required className={inputClass} value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
              <div>
                <label htmlFor="studentNo" className={labelClass}>Öğrenci no</label>
                <input id="studentNo" inputMode="numeric" autoComplete="off" required placeholder="202100184" className={inputClass} value={studentNo} onChange={(e) => setStudentNo(e.target.value)} />
              </div>
              <div>
                <label htmlFor="phone" className={labelClass}>Telefon</label>
                <input id="phone" type="tel" autoComplete="tel" required placeholder="05xx xxx xx xx" className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div>
                <label htmlFor="department" className={labelClass}>Bölüm</label>
                <select
                  id="department"
                  required
                  className={inputClass}
                  value={department}
                  onChange={(e) => {
                    const next = e.target.value;
                    setDepartment(next);
                    const allowed = new Set(classOptions(next).map((item) => item.value));
                    setClassYear((current) => (allowed.has(current) ? current : ''));
                  }}
                >
                  <option value="">Seç</option>
                  {FACULTY_DEPARTMENTS.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="classYear" className={labelClass}>Sınıf</label>
                <select id="classYear" required className={inputClass} value={classYear} onChange={(e) => setClassYear(e.target.value)}>
                  <option value="">Seç</option>
                  {classOptions(department).map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="regEmail" className={labelClass}>E-posta</label>
                <input id="regEmail" type="email" autoComplete="email" required className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <label htmlFor="regPassword" className={labelClass}>Şifre</label>
                <input id="regPassword" type="password" autoComplete="new-password" required className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div>
                <label htmlFor="regConfirm" className={labelClass}>Şifre tekrar</label>
                <input id="regConfirm" type="password" autoComplete="new-password" required className={inputClass} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              </div>
              </div>
              {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p> : null}
              <button type="submit" className={primaryButtonClass}>Kaydı tamamla</button>
              <p className="text-center text-sm text-slate-600">
                Zaten hesabın var mı?{' '}
                <button type="button" className={linkButtonClass} onClick={() => openPanel('login')}>Giriş yap</button>
              </p>
            </form>
          ) : null}

          {panel === 'pending' && pending ? (
            <div className="space-y-4 text-center">
              <p className="text-sm leading-relaxed text-slate-600">
                Kaydın alındı. Öğrenci kimlik kartınla yöneticiye git. Yönetici bu QR kodu okur veya kodu onaylar. Onay gelmeden giriş yapamazsın.
              </p>
              <img
                src={`/api/qr?code=${encodeURIComponent(pending.approvalCode)}`}
                alt=""
                className="mx-auto h-44 w-44 rounded-2xl bg-white p-2 ring-1 ring-slate-200"
              />
              <p className="text-sm font-semibold tracking-wide text-[#0E1548]">{pending.approvalCode}</p>
              <p className="text-xs text-slate-500">QR yalnızca bu onay kodunu taşır. Adın ve öğrenci numaran kodun içinde yoktur.</p>
              <p className="text-sm text-slate-600">Onay bekleniyor…</p>
              <button type="button" className={linkButtonClass} onClick={() => openPanel('login')}>
                Giriş ekranına dön
              </button>
            </div>
          ) : null}
      </div>
      {panel === 'login' ? (
        <div className="w-full max-w-md text-center">
          <button
            type="button"
            aria-haspopup="dialog"
            aria-expanded={demoOpen}
            className="text-[11px] font-medium uppercase tracking-wide text-slate-400 hover:text-slate-600"
            onClick={() => setDemoOpen(true)}
          >
            Geçici demo
          </button>
        </div>
      ) : null}
      {mounted && demoOpen
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Geçici demo"
              className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 px-4 backdrop-blur-md"
              onClick={() => setDemoOpen(false)}
            >
              <div
                className={`${cardClass} w-full max-w-sm p-4`}
                data-scroll-lock-allow=""
                onClick={(event) => event.stopPropagation()}
              >
                <p className="px-1 pb-3 text-center text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Geçici demo
                </p>
                <div className="flex flex-col gap-2">
                  {DEMO_ACCOUNTS.map((account) => (
                    <button
                      key={account.email}
                      type="button"
                      className={`${btnSecondary} w-full justify-center px-3 py-2 text-sm`}
                      disabled={loading}
                      onClick={() => {
                        setDemoOpen(false);
                        setEmail(account.email);
                        setPassword(account.password);
                        setError(null);
                        setLoading(true);
                        void enterDemo(account.email, account.password).finally(() => setLoading(false));
                      }}
                    >
                      {account.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
      {forgotModal}
    </div>
  );
}
