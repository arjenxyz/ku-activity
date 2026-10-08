'use client';

import { FormEvent, useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { FiX } from 'react-icons/fi';
import { inputClass, primaryButtonClass } from '@/components/auth/authStyles';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { classOptions, DEPARTMENT_CHOICES, OTHER_DEPARTMENT } from '@/lib/faculty';
import { FormSelect } from '@/components/auth/FormSelect';
import { cardClass } from '@/components/ui/styles';

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-[#0E1548]">
        {label}
        <span className="ml-0.5 text-red-500" aria-hidden>
          *
        </span>
      </label>
      {children}
    </div>
  );
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('90')) return `0${digits.slice(2)}`;
  if (digits.length === 10 && digits.startsWith('5')) return `0${digits}`;
  if (digits.length === 11 && digits.startsWith('05')) return digits;
  return null;
}

export default function ForumPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [studentNo, setStudentNo] = useState('');
  const [studentKind, setStudentKind] = useState<'local' | 'international' | ''>('');
  const [phone, setPhone] = useState('');
  const [contactAck, setContactAck] = useState(false);
  const [department, setDepartment] = useState('');
  const [otherDepartment, setOtherDepartment] = useState('');
  const [classYear, setClassYear] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [legal, setLegal] = useState<'gizlilik' | 'kvkk' | null>(null);
  const [mounted, setMounted] = useState(false);

  useBodyScrollLock(legal !== null);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!legal) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLegal(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [legal]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!/^\d{9}$/.test(studentNo.trim())) {
      setError('Öğrenci numarası 9 haneli olmalı');
      return;
    }
    if (!studentKind) {
      setError('Öğrenci türünü seç');
      return;
    }
    if (studentKind === 'international') {
      const digits = phone.replace(/\D/g, '');
      if (digits.length < 8 || digits.length > 15) {
        setError('Telefonu ülke koduyla yaz. Örneğin +49 151 2345678');
        return;
      }
      if (!contactAck) {
        setError('Ulaşamayınca nasıl haber vereceğimizi onaylaman gerekir.');
        return;
      }
    } else if (!normalizePhone(phone)) {
      setError('Telefon numarası 05xx xxx xx xx biçiminde olmalı');
      return;
    }
    if (department === OTHER_DEPARTMENT && !otherDepartment.trim()) {
      setError('Bölüm adını yaz');
      return;
    }
    if (!department) {
      setError('Bölüm seç');
      return;
    }
    if (!classYear) {
      setError('Sınıf seç');
      return;
    }
    if (password.length < 8) {
      setError('Şifre en az 8 karakter olmalı');
      return;
    }
    if (password !== confirm) {
      setError('Şifreler aynı değil');
      return;
    }
    if (!accepted) {
      setError('Kayıttan önce Gizlilik ve KVKK metinlerini okuman gerekir.');
      return;
    }
    setSent(true);
  }

  return (
    <div className="min-h-[100dvh] bg-[#f5f6f7] px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-xl rounded-2xl bg-white px-5 py-8 shadow-sm ring-1 ring-black/[0.04] sm:px-8">
        {sent ? (
          <div className="py-6">
            <p className="text-xl font-semibold text-[#0E1548]">Kaydın alındı</p>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Gönüllü ekip üyeleriyle iletişime geç. Öğrenci kimlik kartınla kaydını onaylat. Onay gelmeden giriş yapamazsın.
            </p>
            <Link href="/ekip" className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-800">
              Ekip sayfasına git
            </Link>
            <button
              type="button"
              className="mt-6 block text-sm font-medium text-slate-500 hover:text-slate-700"
              onClick={() => setSent(false)}
            >
              Yeniden doldur
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-[#0E1548]">Kayıt ol</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Kaydın ekip onayından sonra açılır. Onay gelmeden giriş yapamazsın.
            </p>
            <form onSubmit={onSubmit} className="mt-8 space-y-6">
              <Field id="forum-first" label="Ad">
                <input id="forum-first" required autoComplete="given-name" className={inputClass} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </Field>
              <Field id="forum-last" label="Soyad">
                <input id="forum-last" required autoComplete="family-name" className={inputClass} value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </Field>
              <Field id="forum-no" label="Öğrenci no">
                <input id="forum-no" required inputMode="numeric" placeholder="202100184" className={inputClass} value={studentNo} onChange={(e) => setStudentNo(e.target.value)} />
              </Field>
              <Field id="forum-kind" label="Öğrenci türü">
                <FormSelect
                  id="forum-kind"
                  placeholder="Seç"
                  value={studentKind}
                  options={[
                    { value: 'local', label: 'Türkiye', hint: 'Telefon 05 ile başlar' },
                    { value: 'international', label: 'Uluslararası öğrenci', hint: 'Telefon ülke koduyla yazılır' },
                  ]}
                  onChange={(next) => {
                    setStudentKind(next as 'local' | 'international');
                    setPhone('');
                    setContactAck(false);
                  }}
                />
              </Field>
              <Field id="forum-phone" label="Telefon">
                <input
                  id="forum-phone"
                  required
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder={studentKind === 'international' ? '+49 151 2345678' : '05xx xxx xx xx'}
                  className={inputClass}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </Field>
              {studentKind === 'international' ? (
                <label className="flex items-start gap-3 text-sm leading-relaxed text-slate-600">
                  <input
                    type="checkbox"
                    required
                    checked={contactAck}
                    onChange={(e) => setContactAck(e.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300"
                  />
                  <span>
                    Etkinlik günlerinde size ulaşamazsak, güvenlik veya etkinlik bilgilendirmesi için gerekirse WhatsApp veya alternatif uygulamalarla ekibimiz sizlere ulaşır.
                    <span className="text-red-500" aria-hidden> *</span>
                  </span>
                </label>
              ) : null}
              <Field id="forum-dept" label="Bölüm">
                <FormSelect
                  id="forum-dept"
                  placeholder="Seç"
                  value={department}
                  options={DEPARTMENT_CHOICES}
                  onChange={(next) => {
                    setDepartment(next);
                    const allowed = new Set(classOptions(next).map((item) => item.value));
                    setClassYear((current) => (allowed.has(current) ? current : ''));
                  }}
                />
              </Field>
              {department === OTHER_DEPARTMENT ? (
                <Field id="forum-dept-other" label="Bölümün">
                  <input
                    id="forum-dept-other"
                    required
                    className={inputClass}
                    placeholder="Örneğin Coğrafya"
                    value={otherDepartment}
                    onChange={(e) => setOtherDepartment(e.target.value)}
                  />
                </Field>
              ) : null}
              <Field id="forum-class" label="Sınıf">
                <FormSelect
                  id="forum-class"
                  placeholder="Seç"
                  value={classYear}
                  options={classOptions(department)}
                  onChange={setClassYear}
                />
              </Field>
              <Field id="forum-email" label="E-posta">
                <input id="forum-email" required type="email" autoComplete="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              <Field id="forum-password" label="Şifre">
                <input id="forum-password" required type="password" autoComplete="new-password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} />
              </Field>
              <Field id="forum-confirm" label="Şifre tekrar">
                <input id="forum-confirm" required type="password" autoComplete="new-password" className={inputClass} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              </Field>
              {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p> : null}
              <label className="flex items-start gap-3 text-sm leading-relaxed text-slate-600">
                <input
                  type="checkbox"
                  required
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300"
                />
                <span>
                  <button type="button" className="font-medium text-[#0E1548] underline" onClick={() => setLegal('gizlilik')}>
                    Gizlilik
                  </button>
                  {' '}ve{' '}
                  <button type="button" className="font-medium text-[#0E1548] underline" onClick={() => setLegal('kvkk')}>
                    KVKK
                  </button>
                  {' '}metinlerini okudum.
                </span>
              </label>
              <button type="submit" className={primaryButtonClass}>Kaydı tamamla</button>
            </form>
          </>
        )}
      </div>
      {mounted && legal
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="forum-legal-title"
              className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 px-4 py-6 backdrop-blur-md"
            >
              <section className={`${cardClass} flex max-h-[min(32rem,calc(100dvh-3rem))] w-full max-w-lg flex-col p-6`} data-scroll-lock-allow="">
                <div className="flex items-start justify-between gap-4">
                  <h2 id="forum-legal-title" className="text-lg font-semibold text-[#0E1548]">
                    {legal === 'gizlilik' ? 'Gizlilik' : 'KVKK'}
                  </h2>
                  <button
                    type="button"
                    aria-label="Kapat"
                    onClick={() => setLegal(null)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[#0E1548] hover:bg-slate-50"
                  >
                    <FiX className="h-5 w-5" aria-hidden />
                  </button>
                </div>
                <div className="mt-4 overflow-y-auto text-sm leading-relaxed text-slate-600">
                  {legal === 'gizlilik' ? (
                    <p>
                      Bu form ad, soyad, öğrenci numarası, telefon, bölüm, sınıf ve e-posta bilgini yalnızca etkinlik kaydın için tutar. Bilgiler gönüllü ekibin kaydı öğrenci kimliğinle doğrulaması içindir. Üniversite adına toplanmaz ve başka bir hizmete aktarılmaz.
                    </p>
                  ) : (
                    <p>
                      Kişisel verileriniz, kayıt oluşturmak ve kimliğini doğrulamak için 6698 sayılı Kanun kapsamında işlenir. Verilerine ilişkin taleplerini gönüllü ekibe iletebilirsin. Onaylanmayan kayıt girişe açılmaz.
                    </p>
                  )}
                </div>
              </section>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
