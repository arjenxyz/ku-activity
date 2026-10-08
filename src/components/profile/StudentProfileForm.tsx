'use client';

import { FormEvent, useEffect, useState } from 'react';
import { FormSelect } from '@/components/auth/FormSelect';
import { inputClass, labelClass, primaryButtonClass } from '@/components/auth/authStyles';
import { classOptions, DEPARTMENT_CHOICES } from '@/lib/faculty';

type Profile = {
  fullName: string | null;
  email: string | null;
  studentNo: string | null;
  department: string | null;
  classYear: string | null;
  phone: string | null;
};

export function StudentProfileForm() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState(DEPARTMENT_CHOICES[0].value);
  const [classYear, setClassYear] = useState('1');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      const response = await fetch('/api/profile');
      const payload = (await response.json().catch(() => null)) as { profile?: Profile } | null;
      const row = payload?.profile;
      if (!row) return;
      setProfile(row);
      setFullName(row.fullName ?? '');
      setDepartment(row.department || DEPARTMENT_CHOICES[0].value);
      setClassYear(row.classYear || '1');
      setPhone(row.phone ?? '');
    })();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, department, classYear, phone }),
      });
      const payload = (await response.json().catch(() => null)) as {
        profile?: Profile;
        error?: string;
      } | null;
      if (!response.ok) {
        setError(payload?.error ?? 'Kaydedilemedi');
        return;
      }
      setProfile(payload?.profile ?? null);
      setMessage('Profil güncellendi');
    } finally {
      setLoading(false);
    }
  }

  if (!profile) {
    return <p className="text-sm text-slate-500">Profil yükleniyor…</p>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-slate-200/80 bg-white/70 p-5">
      <div>
        <p className={labelClass}>E-posta</p>
        <p className="mt-1 text-sm text-slate-600">{profile.email}</p>
      </div>
      <div>
        <p className={labelClass}>Öğrenci no</p>
        <p className="mt-1 text-sm text-slate-600">{profile.studentNo ?? '—'}</p>
      </div>
      <div>
        <label htmlFor="fullName" className={labelClass}>Ad soyad</label>
        <input id="fullName" className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
      </div>
      <div>
        <p className={labelClass}>Bölüm</p>
        <FormSelect
          id="department"
          placeholder="Bölüm seç"
          value={department}
          onChange={(value) => {
            setDepartment(value);
            const next = classOptions(value);
            if (!next.some((item) => item.value === classYear)) {
              setClassYear(next[0]?.value ?? '1');
            }
          }}
          options={DEPARTMENT_CHOICES}
        />
      </div>
      <div>
        <p className={labelClass}>Sınıf</p>
        <FormSelect
          id="classYear"
          placeholder="Sınıf seç"
          value={classYear}
          onChange={setClassYear}
          options={classOptions(department)}
        />
      </div>
      <div>
        <label htmlFor="phone" className={labelClass}>Telefon</label>
        <input
          id="phone"
          inputMode="tel"
          className={inputClass}
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 15))}
          placeholder="5xxxxxxxxx"
        />
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      <button type="submit" disabled={loading} className={primaryButtonClass}>
        {loading ? 'Kaydediliyor…' : 'Kaydet'}
      </button>
    </form>
  );
}
