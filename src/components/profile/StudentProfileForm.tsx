'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { FiAlertCircle, FiCheck, FiLock, FiRefreshCw } from 'react-icons/fi';
import { FormSelect } from '@/components/auth/FormSelect';
import { classOptions, DEPARTMENT_CHOICES, OTHER_DEPARTMENT } from '@/lib/faculty';
import {
  normalizeTrMobile,
  resolveDepartmentUi,
  splitFullName,
  validateProfilePatch,
} from '@/lib/profile/validate';

type Profile = {
  fullName: string | null;
  email: string | null;
  studentNo: string | null;
  department: string | null;
  classYear: string | null;
  phone: string | null;
};

type FieldKey =
  | 'firstName'
  | 'lastName'
  | 'department'
  | 'otherDepartment'
  | 'classYear'
  | 'phone';

function initialsOf(firstName: string, lastName: string) {
  const a = firstName.trim()[0] ?? '';
  const b = lastName.trim()[0] ?? '';
  const out = `${a}${b}`.toUpperCase();
  return out || '?';
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-4 rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 rounded-2xl bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-40 rounded bg-slate-200" />
          <div className="h-3 w-28 rounded bg-slate-100" />
        </div>
      </div>
      <div className="h-16 rounded-xl bg-slate-100" />
      <div className="h-16 rounded-xl bg-slate-100" />
      <div className="h-11 rounded-xl bg-slate-200" />
    </div>
  );
}

export function StudentProfileForm() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [department, setDepartment] = useState(DEPARTMENT_CHOICES[0]?.value ?? '');
  const [otherDepartment, setOtherDepartment] = useState('');
  const [classYear, setClassYear] = useState('1');
  const [phone, setPhone] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<Partial<Record<FieldKey, string>>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const applyProfile = useCallback((row: Profile) => {
    setProfile(row);
    const names = splitFullName(row.fullName);
    setFirstName(names.firstName);
    setLastName(names.lastName);
    const deptUi = resolveDepartmentUi(row.department);
    setDepartment(deptUi.department);
    setOtherDepartment(deptUi.otherDepartment);
    const years = classOptions(deptUi.department).map((item) => item.value);
    const year = row.classYear && years.includes(row.classYear) ? row.classYear : years[0] ?? '1';
    setClassYear(year);
    setPhone(normalizeTrMobile(row.phone ?? ''));
  }, []);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setError(null);
    try {
      const response = await fetch('/api/profile');
      const payload = (await response.json().catch(() => null)) as {
        profile?: Profile;
        error?: string;
      } | null;
      if (response.status === 401) {
        setLoadError('Oturum gerekli. Tekrar giriş yapın.');
        setProfile(null);
        return;
      }
      if (!response.ok || !payload?.profile) {
        setLoadError(payload?.error ?? 'Profil yüklenemedi');
        setProfile(null);
        return;
      }
      applyProfile(payload.profile);
    } catch {
      setLoadError('Bağlantı hatası. Tekrar deneyin.');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [applyProfile]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 4000);
    return () => window.clearTimeout(timer);
  }, [message]);

  const baseline = useMemo(() => {
    if (!profile) return null;
    const names = splitFullName(profile.fullName);
    const deptUi = resolveDepartmentUi(profile.department);
    const years = classOptions(deptUi.department).map((item) => item.value);
    const year =
      profile.classYear && years.includes(profile.classYear)
        ? profile.classYear
        : (years[0] ?? '1');
    return {
      firstName: names.firstName,
      lastName: names.lastName,
      department: deptUi.department,
      otherDepartment: deptUi.otherDepartment,
      classYear: year,
      phone: normalizeTrMobile(profile.phone ?? ''),
    };
  }, [profile]);

  const dirty = useMemo(() => {
    if (!baseline) return false;
    return (
      firstName.trim() !== baseline.firstName ||
      lastName.trim() !== baseline.lastName ||
      department !== baseline.department ||
      otherDepartment.trim() !== baseline.otherDepartment ||
      classYear !== baseline.classYear ||
      normalizeTrMobile(phone) !== baseline.phone
    );
  }, [baseline, firstName, lastName, department, otherDepartment, classYear, phone]);

  function clearFieldError(key: FieldKey) {
    setFieldError((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setFieldError({});

    const validated = validateProfilePatch({
      firstName,
      lastName,
      department,
      otherDepartment,
      classYear,
      phone,
    });
    if (!validated.ok) {
      setError(validated.error);
      if (validated.field) {
        setFieldError({ [validated.field]: validated.error });
      }
      return;
    }
    if (!dirty) {
      setMessage('Değişiklik yok');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: validated.data.firstName,
          lastName: validated.data.lastName,
          fullName: validated.data.fullName,
          department,
          otherDepartment,
          classYear: validated.data.classYear,
          phone: validated.data.phone,
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        profile?: Profile;
        error?: string;
        field?: FieldKey;
      } | null;

      if (response.status === 401) {
        setError('Oturum sona erdi. Tekrar giriş yapın.');
        return;
      }
      if (!response.ok) {
        setError(payload?.error ?? 'Kaydedilemedi');
        if (payload?.field) setFieldError({ [payload.field]: payload.error });
        return;
      }
      if (!payload?.profile) {
        setError('Sunucu yanıtı eksik');
        return;
      }
      applyProfile(payload.profile);
      setMessage('Profil güncellendi');
    } catch {
      setError('Bağlantı hatası. Kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Skeleton />;

  if (loadError || !profile) {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
          <FiAlertCircle className="h-5 w-5" aria-hidden />
        </span>
        <p className="mt-3 text-sm font-semibold text-[#0E1548]">Profil açılamadı</p>
        <p className="mt-1 text-sm text-slate-500">{loadError ?? 'Bilinmeyen hata'}</p>
        <button
          type="button"
          onClick={() => void loadProfile()}
          className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-[#2D6AF6] px-4 text-sm font-semibold text-white hover:bg-[#2558d4]"
        >
          <FiRefreshCw className="h-4 w-4" aria-hidden />
          Tekrar dene
        </button>
      </div>
    );
  }

  const yearOptions = classOptions(department);
  const inputBase =
    'w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-[#0E1548] outline-none transition focus:ring-2 focus:ring-[#2D6AF6]/35';
  const inputOk = `${inputBase} border-slate-200 focus:border-transparent`;
  const inputBad = `${inputBase} border-red-300 focus:ring-red-200`;

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm shadow-slate-900/5"
    >
      <div className="border-b border-slate-100 bg-gradient-to-br from-[#0E1548] to-[#1a3a7a] px-5 py-5 text-white">
        <div className="flex items-center gap-3">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-lg font-bold tracking-wide ring-1 ring-white/20">
            {initialsOf(firstName, lastName)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold tracking-tight">
              {[firstName, lastName].filter(Boolean).join(' ') || profile.fullName || 'Öğrenci'}
            </p>
            <p className="mt-0.5 truncate text-xs text-white/70">{profile.email}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-5 py-5">
        <p className="text-xs leading-relaxed text-slate-500">
          Kayıt sırasında verdiğin bilgiler. Hepsi aynı anda düzenlenebilir; e-posta ve öğrenci
          numarası güvenlik için kilitlidir.
        </p>

        {/* Same field order as registration — no progressive lock */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="mb-1.5 block text-sm font-medium text-slate-700">
              Ad
            </label>
            <input
              id="firstName"
              name="firstName"
              autoComplete="given-name"
              className={fieldError.firstName ? inputBad : inputOk}
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                clearFieldError('firstName');
              }}
              maxLength={40}
              required
            />
            {fieldError.firstName ? (
              <p className="mt-1 text-xs text-red-600">{fieldError.firstName}</p>
            ) : null}
          </div>
          <div>
            <label htmlFor="lastName" className="mb-1.5 block text-sm font-medium text-slate-700">
              Soyad
            </label>
            <input
              id="lastName"
              name="lastName"
              autoComplete="family-name"
              className={fieldError.lastName ? inputBad : inputOk}
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                clearFieldError('lastName');
              }}
              maxLength={60}
              required
            />
            {fieldError.lastName ? (
              <p className="mt-1 text-xs text-red-600">{fieldError.lastName}</p>
            ) : null}
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 px-3.5 py-3 ring-1 ring-slate-100">
          <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            <FiLock className="h-3 w-3" aria-hidden />
            Öğrenci no
          </p>
          <p className="mt-1 font-mono text-sm font-medium text-slate-700">
            {profile.studentNo || '—'}
          </p>
        </div>

        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-slate-700">
            Telefon
          </label>
          <div className="flex gap-2">
            <span className="inline-flex h-[42px] shrink-0 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-600">
              +90
            </span>
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              className={fieldError.phone ? inputBad : inputOk}
              value={phone}
              onChange={(e) => {
                setPhone(normalizeTrMobile(e.target.value));
                clearFieldError('phone');
              }}
              placeholder="5xxxxxxxxx"
              maxLength={10}
            />
          </div>
          <p className="mt-1 text-[11px] text-slate-400">05xx xxx xx xx — baştaki 0 olmadan</p>
          {fieldError.phone ? (
            <p className="mt-1 text-xs text-red-600">{fieldError.phone}</p>
          ) : null}
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium text-slate-700">Bölüm</p>
          <FormSelect
            id="department"
            placeholder="Bölüm seç"
            value={department}
            onChange={(value) => {
              setDepartment(value);
              clearFieldError('department');
              const next = classOptions(value);
              if (!next.some((item) => item.value === classYear)) {
                setClassYear(next[0]?.value ?? '1');
              }
            }}
            options={DEPARTMENT_CHOICES}
          />
          {fieldError.department ? (
            <p className="mt-1 text-xs text-red-600">{fieldError.department}</p>
          ) : null}
        </div>

        {department === OTHER_DEPARTMENT ? (
          <div>
            <label
              htmlFor="otherDepartment"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Bölümün
            </label>
            <input
              id="otherDepartment"
              className={fieldError.otherDepartment ? inputBad : inputOk}
              value={otherDepartment}
              onChange={(e) => {
                setOtherDepartment(e.target.value);
                clearFieldError('otherDepartment');
              }}
              placeholder="Fakülte / bölüm adını yazın"
              maxLength={80}
            />
            {fieldError.otherDepartment ? (
              <p className="mt-1 text-xs text-red-600">{fieldError.otherDepartment}</p>
            ) : null}
          </div>
        ) : null}

        <div>
          <p className="mb-1.5 text-sm font-medium text-slate-700">Sınıf</p>
          <FormSelect
            id="classYear"
            placeholder="Sınıf seç"
            value={classYear}
            onChange={(value) => {
              setClassYear(value);
              clearFieldError('classYear');
            }}
            options={yearOptions}
          />
          {fieldError.classYear ? (
            <p className="mt-1 text-xs text-red-600">{fieldError.classYear}</p>
          ) : null}
        </div>

        <div className="rounded-xl bg-slate-50 px-3.5 py-3 ring-1 ring-slate-100">
          <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            <FiLock className="h-3 w-3" aria-hidden />
            E-posta
          </p>
          <p className="mt-1 break-all text-sm font-medium text-slate-700">
            {profile.email || '—'}
          </p>
        </div>

        {error ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700 ring-1 ring-red-100"
          >
            <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{error}</span>
          </div>
        ) : null}
        {message ? (
          <div
            role="status"
            className="flex items-start gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800 ring-1 ring-emerald-100"
          >
            <FiCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{message}</span>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={saving || !dirty}
          className="flex h-12 w-full items-center justify-center rounded-xl bg-[#2D6AF6] text-sm font-semibold text-white shadow-sm shadow-[#2D6AF6]/25 transition hover:bg-[#2558d4] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Kaydediliyor…' : dirty ? 'Kaydet' : 'Güncel'}
        </button>
      </div>
    </form>
  );
}
