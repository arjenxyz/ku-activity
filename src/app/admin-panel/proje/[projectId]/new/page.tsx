'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { ProjectPageHeader } from '@/components/project/ProjectPageHeader';
import { AlertBanner } from '@/components/project/AlertBanner';
import { cardClass, btnPrimary, labelClass, inputClass, btnSecondary } from '@/components/project/ui';

const initialForm = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  daily_wage: '',
  position: '',
  hire_date: dayjs().format('YYYY-MM-DD'),
  pin: '',
};

export default function NewEmployeePage() {
  const router = useRouter();
  const { projectId } = useParams() as { projectId?: string };
  const [form, setForm] = useState({ ...initialForm });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value ?? '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!form.first_name.trim() || !form.last_name.trim() || !form.email || !form.daily_wage || !form.position || !form.pin) {
      setError('Lütfen zorunlu alanları doldurun (ad, soyad, e-posta).');
      return;
    }
    if (!projectId) {
      setError('Hatalı proje ID.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          firstName: form.first_name.trim(),
          lastName: form.last_name.trim(),
          email: form.email || undefined,
          phone: form.phone || undefined,
          dailyWage: Number(form.daily_wage),
          position: form.position,
          hireDate: form.hire_date,
          pin: form.pin,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError('Kayıt sırasında bir hata oluştu: ' + (data.error || res.statusText));
        return;
      }

      setSuccess(true);
      setForm({ ...initialForm });
      setTimeout(() => router.push(`/admin-panel/proje/${projectId}`), 1200);
    } catch {
      setError('Beklenmeyen bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  if (!projectId) {
    return <AlertBanner type="error" message="Proje ID bulunamadı." />;
  }

  return (
    <div>
      <ProjectPageHeader
        title="Yeni Personel Ekle"
        description="Manuel kayıt. Fotoğraf için personelin başvuru formundan selfie çekmesi önerilir."
      />
      {error && <AlertBanner type="error" message={error} />}
      {success && <AlertBanner type="success" message="Personel başarıyla kaydedildi!" />}

      <form onSubmit={handleSubmit} className={`${cardClass} p-4 sm:p-6 max-w-xl`}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Ad *</label>
              <input
                type="text"
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                className={inputClass}
                required
                autoComplete="given-name"
              />
            </div>
            <div>
              <label className={labelClass}>Soyad *</label>
              <input
                type="text"
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                className={inputClass}
                required
                autoComplete="family-name"
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>E-posta *</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className={inputClass}
              required
              autoComplete="off"
            />
            <p className="text-xs text-slate-500 mt-1">Personel bu e-posta ile panele giriş yapar.</p>
          </div>
          <div>
            <label className={labelClass}>Telefon</label>
            <input type="tel" name="phone" value={form.phone} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Günlük Maaş (₺) *</label>
            <input
              type="number"
              name="daily_wage"
              value={form.daily_wage}
              onChange={handleChange}
              className={inputClass}
              min={0}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Pozisyon *</label>
            <input type="text" name="position" value={form.position} onChange={handleChange} className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>İşe Giriş Tarihi</label>
            <input type="date" name="hire_date" value={form.hire_date} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Giriş şifresi *</label>
            <input
              type="password"
              name="pin"
              value={form.pin}
              onChange={handleChange}
              className={inputClass}
              minLength={4}
              maxLength={12}
              autoComplete="new-password"
              required
            />
            <p className="text-xs text-slate-500 mt-1">4-12 karakter. E-posta ile birlikte giriş için kullanılır.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button type="submit" className={btnPrimary} disabled={loading}>
              {loading ? 'Kaydediliyor…' : 'Kaydet'}
            </button>
            <button type="button" className={btnSecondary} onClick={() => router.back()}>
              İptal
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
