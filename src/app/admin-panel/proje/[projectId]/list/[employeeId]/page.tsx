'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { EmployeePhotoUpload } from '@/components/employee/EmployeePhotoUpload';
import { ProjectPageHeader } from '@/components/project/ProjectPageHeader';
import { AlertBanner } from '@/components/project/AlertBanner';
import { cardClass, btnPrimary, labelClass, inputClass, btnSecondary } from '@/components/project/ui';
import { fetchEmployee, updateEmployee } from '@/lib/project-api';
import {
  getAgeFromBirthDate,
  isConstructionEligibleBirthDate,
  MIN_CONSTRUCTION_AGE,
} from '@/lib/age-validation';
import { formatDate, formatFullName, splitFullName } from '@/lib/format';

export default function EditEmployeePage() {
  const router = useRouter();
  const { projectId, employeeId } = useParams() as { projectId: string; employeeId: string };
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    daily_wage: '',
    position: '',
    hire_date: '',
    is_active: true,
  });
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sensitive, setSensitive] = useState<{
    tcKimlikMasked: string;
    birthDate: string;
    ibanMasked: string;
    tcKimlik?: string;
    iban?: string;
  } | null>(null);
  const [showSensitive, setShowSensitive] = useState(false);

  useEffect(() => {
    fetchEmployee(projectId, employeeId)
      .then((emp) => {
        const { firstName, lastName } = splitFullName(emp.name);
        setForm({
          first_name: firstName,
          last_name: lastName,
          email: emp.email ?? '',
          phone: emp.phone ?? '',
          daily_wage: String(emp.daily_wage),
          position: emp.position ?? '',
          hire_date: emp.hire_date ?? '',
          is_active: emp.is_active,
        });
        setPhotoUrl(emp.photo_url ?? null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

    fetch(`/api/admin/projects/${projectId}/employees/${employeeId}/sensitive`)
      .then((r) => r.json())
      .then((d) => setSensitive(d.sensitive ?? null))
      .catch(() => setSensitive(null));
  }, [projectId, employeeId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!form.first_name.trim() || !form.last_name.trim() || !form.email || !form.position || !form.daily_wage) {
      setError('Ad, soyad, e-posta, pozisyon ve yevmiye zorunludur.');
      return;
    }

    setSaving(true);
    try {
      await updateEmployee(projectId, employeeId, {
        firstName: form.first_name.trim(),
        lastName: form.last_name.trim(),
        email: form.email,
        phone: form.phone || null,
        position: form.position,
        dailyWage: Number(form.daily_wage),
        hireDate: form.hire_date || null,
        isActive: form.is_active,
      });
      setSuccess(true);
      setTimeout(() => router.push(`/admin-panel/proje/${projectId}/list`), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Güncellenemedi');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-slate-500 py-12 text-center">Yükleniyor…</div>;
  }

  const displayName = formatFullName(form.first_name, form.last_name);

  return (
    <div>
      <ProjectPageHeader
        title="Personel Düzenle"
        description={displayName || 'Personel bilgilerini güncelleyin.'}
      />
      {error && <AlertBanner type="error" message={error} />}
      {success && <AlertBanner type="success" message="Personel güncellendi." />}

      <form onSubmit={handleSubmit} className={`${cardClass} p-4 sm:p-6 max-w-xl space-y-4`}>
        <EmployeePhotoUpload
          projectId={projectId}
          employeeId={employeeId}
          name={displayName || 'Personel'}
          photoUrl={photoUrl}
          onChange={setPhotoUrl}
        />

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
          />
        </div>
        <div>
          <label className={labelClass}>Telefon</label>
          <input type="tel" name="phone" value={form.phone} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Pozisyon *</label>
          <input
            type="text"
            name="position"
            value={form.position}
            onChange={handleChange}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className={labelClass}>Günlük Yevmiye (₺) *</label>
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
          <label className={labelClass}>İşe Giriş Tarihi</label>
          <input
            type="date"
            name="hire_date"
            value={form.hire_date}
            onChange={handleChange}
            className={inputClass}
          />
        </div>
        {sensitive && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm space-y-1">
            <p className="font-medium text-amber-900">Hassas bilgiler (şifreli)</p>
            <p>T.C.: {showSensitive && sensitive.tcKimlik ? sensitive.tcKimlik : sensitive.tcKimlikMasked}</p>
            <p>
              Doğum: {formatDate(sensitive.birthDate)} ({getAgeFromBirthDate(sensitive.birthDate)} yaş)
            </p>
            {!isConstructionEligibleBirthDate(sensitive.birthDate) && (
              <p className="text-red-700 text-xs font-medium">
                Uyarı: {MIN_CONSTRUCTION_AGE} yaş altı — inşaat sahasında çalışamaz.
              </p>
            )}
            <p>IBAN: {showSensitive && sensitive.iban ? sensitive.iban : sensitive.ibanMasked}</p>
            <button
              type="button"
              onClick={() => setShowSensitive((v) => !v)}
              className="text-xs text-amber-800 hover:underline"
            >
              {showSensitive ? 'Maskele' : 'Tam göster'}
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            id="is_active"
            type="checkbox"
            name="is_active"
            checked={form.is_active}
            onChange={handleChange}
            className="rounded border-slate-300"
          />
          <label htmlFor="is_active" className="text-sm text-slate-700">
            Aktif personel
          </label>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button type="submit" className={btnPrimary} disabled={saving}>
            {saving ? 'Kaydediliyor…' : 'Güncelle'}
          </button>
          <Link href={`/admin-panel/proje/${projectId}/list`} className={btnSecondary}>
            İptal
          </Link>
        </div>
      </form>
    </div>
  );
}
