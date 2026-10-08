'use client';

import { FormEvent, useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { FiLock, FiX } from 'react-icons/fi';
import { inputClass, primaryButtonClass } from '@/components/auth/authStyles';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { classOptions, DEPARTMENT_CHOICES, OTHER_DEPARTMENT } from '@/lib/faculty';
import { callingCodeChoices, findCallingCode } from '@/lib/calling-codes';
import { FormSelect } from '@/components/auth/FormSelect';
import { cardClass } from '@/components/ui/styles';

function Field({
  id,
  label,
  className,
  locked = false,
  children,
}: {
  id: string;
  label: string;
  className?: string;
  locked?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className={`mb-2 block text-sm font-medium ${locked ? 'text-slate-400' : 'text-[#0E1548]'}`}>
        {label}
        <span className="ml-0.5 text-red-500" aria-hidden>
          *
        </span>
      </label>
      <div className="relative">
        <div className={locked ? 'pointer-events-none' : undefined}>{children}</div>
        {locked ? (
          <FiLock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
        ) : null}
      </div>
    </div>
  );
}

function phoneError(code: string, digits: string) {
  const rule = findCallingCode(code);
  if (digits.length >= rule.min && digits.length <= rule.max) return null;
  const span = rule.min === rule.max ? `${rule.max} hane` : `${rule.min}–${rule.max} hane`;
  return `+${rule.code} numarası ${span} olmalı`;
}

export default function ForumPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [studentNo, setStudentNo] = useState('');
  const [callingCode, setCallingCode] = useState('90');
  const [phone, setPhone] = useState('');
  const [contactDecision, setContactDecision] = useState<'accepted' | 'rejected' | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
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
  const [codeOpen, setCodeOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useBodyScrollLock(legal !== null || codeOpen || contactOpen);
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
    const phoneDigits = phone.replace(/\D/g, '');
    const invalidPhone = phoneError(callingCode, phoneDigits);
    if (invalidPhone) {
      setError(invalidPhone);
      return;
    }
    if (contactDecision === 'rejected') {
      setError('Bilgilendirme reddedildi. Kayıt tamamlanamaz.');
      return;
    }
    if (contactDecision !== 'accepted') {
      setError('Önce bilgilendirmeyi okuyup kabul et.');
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

  const phoneDigits = phone.replace(/\D/g, '');
  const phoneReady = phoneDigits.length > 0 && phoneError(callingCode, phoneDigits) === null;
  const departmentReady = department.length > 0 && (department !== OTHER_DEPARTMENT || otherDepartment.trim().length > 0);
  const filled = [
    firstName.trim().length > 0,
    lastName.trim().length > 0,
    /^\d{9}$/.test(studentNo.trim()),
    phoneReady,
    contactDecision === 'accepted',
    departmentReady,
    classYear.length > 0,
    email.includes('@'),
    password.length >= 8,
    confirm.length > 0 && confirm === password,
    accepted,
  ];
  const locked = (step: number) => filled.slice(0, step).some((done) => !done);

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
              <Field id="forum-last" label="Soyad" locked={locked(1)}>
                <input id="forum-last" required autoComplete="family-name" disabled={locked(1)} className={inputClass} value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </Field>
              <Field id="forum-no" label="Öğrenci no" locked={locked(2)}>
                <input id="forum-no" required inputMode="numeric" placeholder="202100184" disabled={locked(2)} className={inputClass} value={studentNo} onChange={(e) => setStudentNo(e.target.value)} />
              </Field>
              <Field id="forum-phone" label="Telefon" locked={locked(3)} className={codeOpen ? 'relative z-50' : undefined}>
                <div className="flex gap-2 [container-type:inline-size]">
                  <div className="w-28 shrink-0">
                    <FormSelect
                      id="forum-code"
                      placeholder="+90"
                      value={callingCode}
                      options={callingCodeChoices()}
                      menuClassName="scrollbar-thin-glass left-0 w-[100cqw]"
                      inline
                      disabled={locked(3)}
                      onOpenChange={setCodeOpen}
                      onChange={(next) => {
                        const rule = findCallingCode(next);
                        setCallingCode(next);
                        setPhone((current) => current.replace(/\D/g, '').slice(0, rule.max));
                      }}
                    />
                  </div>
                  <input
                    id="forum-phone"
                    required
                    type="tel"
                    autoComplete="tel"
                    inputMode="numeric"
                    disabled={locked(3)}
                    placeholder={callingCode === '90' ? '5xx xxx xx xx' : `${findCallingCode(callingCode).max} hane`}
                    className={inputClass}
                    value={phone}
                    onChange={(event) => {
                      const rule = findCallingCode(callingCode);
                      let digits = event.target.value.replace(/\D/g, '');
                      if (callingCode === '90') digits = digits.replace(/^0+/, '');
                      setPhone(digits.slice(0, rule.max));
                    }}
                  />
                </div>
              </Field>
              <button
                type="button"
                aria-pressed={contactDecision === 'accepted'}
                disabled={locked(4)}
                onClick={() => setContactOpen(true)}
                className={`flex items-start gap-3 text-left text-sm leading-relaxed ${locked(4) ? 'text-slate-400' : 'text-slate-600'}`}
              >
                <span
                  aria-hidden
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${
                    locked(4)
                      ? 'border-slate-200 bg-slate-50 text-slate-400'
                      : contactDecision === 'accepted'
                      ? 'border-[#0E1548] bg-[#0E1548] text-white'
                      : contactDecision === 'rejected'
                        ? 'border-red-600 bg-red-600 text-white'
                        : 'border-slate-300 bg-white'
                  }`}
                >
                  {locked(4) ? <FiLock className="h-3 w-3" /> : contactDecision === 'accepted' ? '✓' : contactDecision === 'rejected' ? '×' : ''}
                </span>
                <span>
                  {contactDecision === null ? 'Bilgilendirmeyi oku' : 'Bilgilendirmeyi tekrar oku'}
                  {contactDecision !== 'accepted' ? <span className="text-red-500" aria-hidden> *</span> : null}
                </span>
              </button>
              {contactDecision === 'rejected' ? (
                <p className="-mt-4 text-sm text-red-700">Bilgilendirme reddedildi. Kayıt tamamlanamaz.</p>
              ) : null}
              <Field id="forum-dept" label="Bölüm" locked={locked(5)}>
                <FormSelect
                  id="forum-dept"
                  placeholder="Seç"
                  value={department}
                  disabled={locked(5)}
                  options={DEPARTMENT_CHOICES}
                  onChange={(next) => {
                    setDepartment(next);
                    const allowed = new Set(classOptions(next).map((item) => item.value));
                    setClassYear((current) => (allowed.has(current) ? current : ''));
                  }}
                />
              </Field>
              {department === OTHER_DEPARTMENT ? (
                <Field id="forum-dept-other" label="Bölümün" locked={locked(5)}>
                  <input
                    id="forum-dept-other"
                    required
                    disabled={locked(5)}
                    className={inputClass}
                    placeholder="Örneğin Coğrafya"
                    value={otherDepartment}
                    onChange={(e) => setOtherDepartment(e.target.value)}
                  />
                </Field>
              ) : null}
              <Field id="forum-class" label="Sınıf" locked={locked(6)}>
                <FormSelect
                  id="forum-class"
                  placeholder="Seç"
                  value={classYear}
                  disabled={locked(6)}
                  options={classOptions(department)}
                  onChange={setClassYear}
                />
              </Field>
              <Field id="forum-email" label="E-posta" locked={locked(7)}>
                <input id="forum-email" required type="email" autoComplete="email" disabled={locked(7)} className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              <Field id="forum-password" label="Şifre" locked={locked(8)}>
                <input id="forum-password" required type="password" autoComplete="new-password" disabled={locked(8)} className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} />
              </Field>
              <Field id="forum-confirm" label="Şifre tekrar" locked={locked(9)}>
                <input id="forum-confirm" required type="password" autoComplete="new-password" disabled={locked(9)} className={inputClass} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              </Field>
              {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p> : null}
              <label className={`relative flex items-start gap-3 text-sm leading-relaxed ${locked(10) ? 'pointer-events-none text-slate-400' : 'text-slate-600'}`}>
                <input
                  type="checkbox"
                  required
                  checked={accepted}
                  disabled={locked(10)}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300"
                />
                <span>
                  <button type="button" className="font-medium underline disabled:text-slate-400" disabled={locked(10)} onClick={() => setLegal('gizlilik')}>
                    Gizlilik
                  </button>
                  {' '}ve{' '}
                  <button type="button" className="font-medium underline disabled:text-slate-400" disabled={locked(10)} onClick={() => setLegal('kvkk')}>
                    KVKK
                  </button>
                  {' '}metinlerini okudum.
                </span>
                {locked(10) ? <FiLock className="ml-auto h-4 w-4 shrink-0 text-slate-400" aria-hidden /> : null}
              </label>
              <button type="submit" className={primaryButtonClass} disabled={locked(11) || contactDecision === 'rejected'}>Kaydı tamamla</button>
            </form>
          </>
        )}
      </div>
      {mounted && codeOpen
        ? createPortal(
            <div className="fixed inset-0 z-40 bg-slate-900/35 backdrop-blur-md" />,
            document.body,
          )
        : null}
      {mounted && contactOpen
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="forum-contact-title"
              className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 px-4 py-6 backdrop-blur-md"
            >
              <section className={`${cardClass} w-full max-w-lg p-6`} data-scroll-lock-allow="">
                <h2 id="forum-contact-title" className="text-lg font-semibold text-[#0E1548]">Bilgilendirme</h2>
                <p className="mt-4 text-sm leading-relaxed text-slate-600">
                  Etkinlik günlerinde size ulaşamazsak, güvenlik veya etkinlik bilgilendirmesi için gerekirse WhatsApp veya alternatif uygulamalarla ekibimiz sizlere ulaşır.
                </p>
                <div className="mt-6 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className="rounded-xl px-3 py-2.5 text-sm font-medium text-[#0E1548] ring-1 ring-slate-200 hover:bg-slate-50"
                    onClick={() => {
                      setContactDecision('rejected');
                      setContactOpen(false);
                    }}
                  >
                    Reddet
                  </button>
                  <button
                    type="button"
                    className="rounded-xl bg-[#0E1548] px-3 py-2.5 text-sm font-medium text-white"
                    onClick={() => {
                      setContactDecision('accepted');
                      setContactOpen(false);
                    }}
                  >
                    Kabul et
                  </button>
                </div>
              </section>
            </div>,
            document.body,
          )
        : null}
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
