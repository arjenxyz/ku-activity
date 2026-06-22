'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiBriefcase, FiCheckCircle, FiMail, FiUserPlus } from 'react-icons/fi';
import { AdminRegisterLayout } from '@/components/auth/AdminRegisterLayout';
import { AuthAlert, LoadingSpinner } from '@/components/auth/AuthAlerts';
import { TurkishPhoneInput } from '@/components/forms/TurkishPhoneInput';
import {
  ADMIN_JOB_TITLES,
  ADMIN_PROJECT_COUNTS,
  ADMIN_REFERRAL_SOURCES,
  ADMIN_TEAM_SIZES,
} from '@/config/admin-register';
import { validateAdminRegister } from '@/lib/admin-register-validation';
import { verificationCodeMailto } from '@/lib/support-email';
import { createClient } from '@/utils/supabase/client';
import {
  credentialLoginFormProps,
  loginEmailInputProps,
  registerPasswordInputProps,
} from '@/components/auth/loginFormProps';

const inputClass =
  'block w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500';
const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';
const sectionTitleClass =
  'text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3';
const panelClass =
  'rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 p-4 sm:p-5';

const STEPS = [
  { title: 'Hesap oluştur', desc: 'Kişisel ve firma bilgilerinizi girin' },
  { title: 'Doğrulama kodu', desc: 'Proje açmak için kod talep edin' },
  { title: 'Şantiye ekleyin', desc: 'Personel ve puantaj yönetimine başlayın' },
];

export default function AdminRegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company_name: '',
    job_title: '',
    city: '',
    team_size: '',
    project_count: '',
    referral_source: '',
    password: '',
    password_confirm: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const update = (patch: Partial<typeof form>) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateAdminRegister({
      firstName: form.first_name,
      lastName: form.last_name,
      email: form.email,
      phone: form.phone,
      companyName: form.company_name,
      jobTitle: form.job_title,
      city: form.city,
      teamSize: form.team_size,
      projectCount: form.project_count,
      referralSource: form.referral_source,
      password: form.password,
      passwordConfirm: form.password_confirm,
    });
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/admin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.first_name,
          lastName: form.last_name,
          email: form.email,
          phone: form.phone,
          companyName: form.company_name,
          jobTitle: form.job_title,
          city: form.city,
          teamSize: form.team_size,
          projectCount: form.project_count,
          referralSource: form.referral_source || undefined,
          password: form.password,
          passwordConfirm: form.password_confirm,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Kayıt başarısız');
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
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
    <AdminRegisterLayout>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(240px,300px)_minmax(0,1fr)] xl:items-start">
        <aside className="space-y-4">
          <div className={panelClass}>
            <h2 className={sectionTitleClass}>Nasıl çalışır?</h2>
            <ol className="space-y-4">
              {STEPS.map((step, index) => (
                <li key={step.title} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{step.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{step.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-xl border border-blue-100 dark:border-blue-900/50 bg-blue-50/80 dark:bg-blue-950/30 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <FiMail className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">Doğrulama kodu</p>
                <p className="mt-1.5 text-xs text-blue-800/90 dark:text-blue-200/80 leading-relaxed">
                  İlk projenizi oluşturmak için doğrulama kodu gerekir. Kayıt sonrası e-posta ile
                  talep edebilirsiniz.
                </p>
                <a
                  href={verificationCodeMailto()}
                  className="mt-3 inline-flex text-xs font-semibold text-blue-700 dark:text-blue-300 hover:underline"
                >
                  Kod için bize yazın →
                </a>
              </div>
            </div>
          </div>

          <div className="hidden xl:block rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 p-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            <FiBriefcase className="h-4 w-4 text-slate-400 mb-2" />
            CrewLedger; yevmiye, mesai, avans ve asgari ücret takibini şantiye operasyonlarına özel
            olarak sunar.
          </div>
        </aside>

        <div className="rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-black/30 border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 sm:p-6 lg:p-8">
          {error && (
            <div className="mb-5">
              <AuthAlert message={error} type="error" />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8" {...credentialLoginFormProps}>
            <section>
              <h2 className={sectionTitleClass}>Kişisel bilgiler</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reg-first" className={labelClass}>
                    Ad *
                  </label>
                  <input
                    id="reg-first"
                    className={inputClass}
                    value={form.first_name}
                    onChange={(e) => update({ first_name: e.target.value })}
                    required
                    autoComplete="given-name"
                  />
                </div>
                <div>
                  <label htmlFor="reg-last" className={labelClass}>
                    Soyad *
                  </label>
                  <input
                    id="reg-last"
                    className={inputClass}
                    value={form.last_name}
                    onChange={(e) => update({ last_name: e.target.value })}
                    required
                    autoComplete="family-name"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="reg-email" className={labelClass}>
                    E-posta *
                  </label>
                  <input
                    id="reg-email"
                    className={inputClass}
                    value={form.email}
                    onChange={(e) => update({ email: e.target.value })}
                    required
                    {...loginEmailInputProps}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="reg-phone" className={labelClass}>
                    Cep telefonu *
                  </label>
                  <TurkishPhoneInput
                    id="reg-phone"
                    className={inputClass}
                    value={form.phone}
                    onChange={(phone) => update({ phone })}
                    required
                  />
                </div>
              </div>
            </section>

            <section>
              <h2 className={sectionTitleClass}>Firma ve operasyon</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="reg-company" className={labelClass}>
                    Firma veya şantiye adı *
                  </label>
                  <input
                    id="reg-company"
                    className={inputClass}
                    value={form.company_name}
                    onChange={(e) => update({ company_name: e.target.value })}
                    placeholder="Örn. Yılmaz İnşaat / Merkez Şantiye"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="reg-job" className={labelClass}>
                    Görev / unvan *
                  </label>
                  <select
                    id="reg-job"
                    className={inputClass}
                    value={form.job_title}
                    onChange={(e) => update({ job_title: e.target.value })}
                    required
                  >
                    <option value="">Seçin</option>
                    {ADMIN_JOB_TITLES.map((title) => (
                      <option key={title} value={title}>
                        {title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="reg-city" className={labelClass}>
                    Şehir *
                  </label>
                  <input
                    id="reg-city"
                    className={inputClass}
                    value={form.city}
                    onChange={(e) => update({ city: e.target.value })}
                    placeholder="Örn. İstanbul"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="reg-team" className={labelClass}>
                    Tahmini personel sayısı *
                  </label>
                  <select
                    id="reg-team"
                    className={inputClass}
                    value={form.team_size}
                    onChange={(e) => update({ team_size: e.target.value })}
                    required
                  >
                    <option value="">Seçin</option>
                    {ADMIN_TEAM_SIZES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="reg-projects" className={labelClass}>
                    Aktif şantiye sayısı *
                  </label>
                  <select
                    id="reg-projects"
                    className={inputClass}
                    value={form.project_count}
                    onChange={(e) => update({ project_count: e.target.value })}
                    required
                  >
                    <option value="">Seçin</option>
                    {ADMIN_PROJECT_COUNTS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="reg-referral" className={labelClass}>
                    Bizi nereden duydunuz?
                  </label>
                  <select
                    id="reg-referral"
                    className={inputClass}
                    value={form.referral_source}
                    onChange={(e) => update({ referral_source: e.target.value })}
                  >
                    <option value="">İsteğe bağlı</option>
                    {ADMIN_REFERRAL_SOURCES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section>
              <h2 className={sectionTitleClass}>Hesap güvenliği</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reg-password" className={labelClass}>
                    Şifre *
                  </label>
                  <input
                    id="reg-password"
                    className={inputClass}
                    value={form.password}
                    onChange={(e) => update({ password: e.target.value })}
                    required
                    minLength={6}
                    {...registerPasswordInputProps}
                  />
                  <p className="text-xs text-gray-500 mt-1">En az 6 karakter</p>
                </div>
                <div>
                  <label htmlFor="reg-password-confirm" className={labelClass}>
                    Şifre tekrar *
                  </label>
                  <input
                    id="reg-password-confirm"
                    className={inputClass}
                    value={form.password_confirm}
                    onChange={(e) => update({ password_confirm: e.target.value })}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    type="password"
                  />
                </div>
              </div>
            </section>

            <div className="rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/60 dark:bg-emerald-950/20 px-4 py-3 flex gap-3 text-xs text-emerald-900 dark:text-emerald-100">
              <FiCheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>
                Kayıt ücretsizdir. Hesabınız oluşturulduktan sonra yönetici paneline yönlendirilirsiniz;
                ilk şantiyenizi eklemek için doğrulama kodu talep etmeniz yeterlidir.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white px-6 py-3.5 text-sm font-semibold shadow-lg shadow-blue-500/25 transition-colors min-h-[48px]"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner />
                  Hesap oluşturuluyor…
                </>
              ) : (
                <>
                  <FiUserPlus className="w-4 h-4" />
                  Yönetici hesabı oluştur
                </>
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-gray-500 dark:text-gray-400">
            Zaten hesabınız var mı?{' '}
            <Link href="/admin-panel/login" className="text-blue-600 font-medium hover:underline">
              Giriş yapın
            </Link>
          </p>
        </div>
      </div>
    </AdminRegisterLayout>
  );
}
