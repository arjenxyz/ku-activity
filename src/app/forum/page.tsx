'use client';

import { FormEvent, useState, type ReactNode } from 'react';
import { inputClass, primaryButtonClass } from '@/components/auth/authStyles';

const DEPARTMENTS = [
  'Turizm İşletmeciliği',
  'Turizm İşletmeciliği (İngilizce)',
  'Turizm Rehberliği',
  'Gastronomi ve Mutfak Sanatları',
];

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
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [classYear, setClassYear] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!/^\d{9}$/.test(studentNo.trim())) {
      setError('Öğrenci numarası 9 haneli olmalı');
      return;
    }
    if (!normalizePhone(phone)) {
      setError('Telefon numarası 05xx xxx xx xx biçiminde olmalı');
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
    setSent(true);
  }

  return (
    <div className="min-h-[100dvh] bg-[#f5f6f7] px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-xl rounded-2xl bg-white px-5 py-8 shadow-sm ring-1 ring-black/[0.04] sm:px-8">
        {sent ? (
          <div className="py-10 text-center">
            <p className="text-xl font-semibold text-[#0E1548]">Gönderildi</p>
            <button
              type="button"
              className="mt-6 text-sm font-medium text-blue-600 hover:text-blue-800"
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
              <Field id="forum-phone" label="Telefon">
                <input id="forum-phone" required type="tel" autoComplete="tel" placeholder="05xx xxx xx xx" className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
              </Field>
              <Field id="forum-dept" label="Bölüm">
                <select id="forum-dept" required className={inputClass} value={department} onChange={(e) => setDepartment(e.target.value)}>
                  <option value="">Seç</option>
                  {DEPARTMENTS.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </Field>
              <Field id="forum-class" label="Sınıf">
                <select id="forum-class" required className={inputClass} value={classYear} onChange={(e) => setClassYear(e.target.value)}>
                  <option value="">Seç</option>
                  <option value="1">1. sınıf</option>
                  <option value="2">2. sınıf</option>
                  <option value="3">3. sınıf</option>
                  <option value="4">4. sınıf</option>
                </select>
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
              <button type="submit" className={primaryButtonClass}>Kaydı tamamla</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
