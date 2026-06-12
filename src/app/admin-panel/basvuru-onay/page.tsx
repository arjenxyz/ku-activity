'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import Link from 'next/link';
import { FiCheck, FiSearch, FiX } from 'react-icons/fi';
import dynamic from 'next/dynamic';
import { AlertBanner } from '@/components/project/AlertBanner';

const QrCameraScanner = dynamic(
  () => import('@/components/registration/QrCameraScanner').then((m) => m.QrCameraScanner),
  {
    ssr: false,
    loading: () => <p className="text-sm text-slate-500">Kamera modülü yükleniyor…</p>,
  }
);
import { cardClass, btnPrimary, labelClass, inputClass, btnSecondary } from '@/components/project/ui';
import {
  constructionAgeErrorMessage,
  getAgeFromBirthDate,
  isConstructionEligibleBirthDate,
  MIN_CONSTRUCTION_AGE,
} from '@/lib/age-validation';
import { formatDate } from '@/lib/format';

type Registration = {
  id: string;
  verificationCode: string;
  status: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  createdAt: string;
  expiresAt: string;
  photoUrl?: string | null;
  sensitive: {
    tcKimlikMasked: string;
    birthDate: string;
    ibanMasked: string;
    tcKimlik: string;
    iban: string;
  };
};

type Project = { id: string; name: string };

function BasvuruOnayContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialKod = searchParams.get('kod') ?? '';

  const [codeInput, setCodeInput] = useState(initialKod);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSensitive, setShowSensitive] = useState(false);
  const [form, setForm] = useState({
    projectId: '',
    position: '',
    daily_wage: '',
    hire_date: dayjs().format('YYYY-MM-DD'),
  });

  useEffect(() => {
    fetch('/api/admin/projects?filter=active')
      .then((r) => r.json())
      .then((d) => setProjects(d.projects ?? []))
      .catch(() => {});
  }, []);

  const lookup = useCallback(async (kod: string) => {
    if (!kod.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    setShowSensitive(false);
    try {
      const res = await fetch(`/api/admin/registrations/lookup?kod=${encodeURIComponent(kod.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulunamadı');
      setRegistration(data.registration);
      if (data.registration.status !== 'pending') {
        setError(`Bu başvuru durumu: ${data.registration.status}`);
      }
    } catch (e) {
      setRegistration(null);
      setError(e instanceof Error ? e.message : 'Arama başarısız');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialKod) lookup(initialKod);
  }, [initialKod, lookup]);

  const birthDateEligible = registration
    ? isConstructionEligibleBirthDate(registration.sensitive.birthDate)
    : true;
  const applicantAge = registration ? getAgeFromBirthDate(registration.sensitive.birthDate) : null;

  const adminFormValid =
    Boolean(form.projectId) &&
    Boolean(form.position.trim()) &&
    Number(form.daily_wage) > 0 &&
    Boolean(form.hire_date) &&
    birthDateEligible;

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registration) return;
    if (!birthDateEligible) {
      setError(constructionAgeErrorMessage());
      return;
    }
    if (!adminFormValid) {
      setError('Onaylamadan önce tüm yönetici alanlarını doldurun.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/registrations/${registration.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: form.projectId,
          position: form.position,
          dailyWage: Number(form.daily_wage),
          hireDate: form.hire_date,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Onay başarısız');
      setSuccess(
        `Personel kaydı aktif. ${data.email} adresi ile hemen giriş yapabilir — şifreyi personele iletin.`
      );
      setRegistration(null);
      setTimeout(() => router.push(`/admin-panel/proje/${form.projectId}/list`), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Onay başarısız');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (
      !registration ||
      !confirm(
        'Başvuruyu reddetmek istediğinize emin misiniz? Kayıt, fotoğraf ve sözleşme onayları kalıcı olarak silinir; personel aynı bilgilerle yeniden başvurabilir.'
      )
    ) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/registrations/${registration.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Yönetici tarafından reddedildi' }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      setSuccess('Başvuru reddedildi ve veritabanından silindi.');
      setRegistration(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Red başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Personel Başvuru Onayı</h1>
        <p className="text-sm text-slate-500 mt-1">
          Personelin QR kodunu okutun veya başvuru kodunu girin; ardından yevmiye ve pozisyon bilgilerini
          tamamlayın.
        </p>
      </div>

      {error && <AlertBanner type="error" message={error} />}
      {success && <AlertBanner type="success" message={success} />}

      <div className={`${cardClass} p-4 space-y-4`}>
        <QrCameraScanner
          disabled={loading}
          onScan={(code) => {
            setCodeInput(code);
            void lookup(code);
          }}
        />

        <div>
          <label className={labelClass}>veya başvuru kodunu yazın</label>
          <div className="flex gap-2 mt-1.5">
            <input
              className={inputClass}
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              placeholder="ARJ-XXXXXX"
            />
            <button
              type="button"
              onClick={() => lookup(codeInput)}
              disabled={loading}
              className={btnSecondary}
            >
              <FiSearch className="w-4 h-4" />
              Bul
            </button>
          </div>
        </div>
      </div>

      {registration && registration.status === 'pending' && (
        <div className={`${cardClass} p-4 sm:p-6 space-y-4`}>
          <div className="flex items-start gap-4">
            {registration.photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={registration.photoUrl}
                alt=""
                className="w-20 h-20 rounded-2xl object-cover border border-slate-200 shrink-0"
              />
            )}
            <div>
            <h2 className="font-semibold text-lg text-slate-900">
              {registration.firstName} {registration.lastName}
            </h2>
            <p className="text-sm text-slate-500">{registration.email}</p>
            {registration.phone && (
              <p className="text-sm text-slate-500">{registration.phone}</p>
            )}
            <p className="text-xs text-slate-400 mt-2">
              Kod: {registration.verificationCode} · Son: {formatDate(registration.expiresAt.slice(0, 10))}
            </p>
            </div>
          </div>

          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm space-y-1">
            <p className="font-medium text-slate-700">Hassas bilgiler (şifreli saklanır)</p>
            <p>T.C.: {showSensitive ? registration.sensitive.tcKimlik : registration.sensitive.tcKimlikMasked}</p>
            <p>
              Doğum: {formatDate(registration.sensitive.birthDate)}
              {applicantAge !== null && (
                <span className={birthDateEligible ? ' text-slate-600' : ' text-red-700 font-medium'}>
                  {' '}
                  ({applicantAge} yaş)
                </span>
              )}
            </p>
            {!birthDateEligible && (
              <p className="text-red-700 text-xs font-medium mt-1">
                {MIN_CONSTRUCTION_AGE} yaş altı — inşaat sahasında çalışamaz, onaylanamaz.
              </p>
            )}
            <p>IBAN: {showSensitive ? registration.sensitive.iban : registration.sensitive.ibanMasked}</p>
            <button
              type="button"
              onClick={() => setShowSensitive((v) => !v)}
              className="text-xs text-blue-700 hover:underline mt-1"
            >
              {showSensitive ? 'Gizle' : 'Tam göster (yalnızca onay öncesi)'}
            </button>
          </div>

          <form onSubmit={handleApprove} className="space-y-3 border-t border-slate-200 pt-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <p className="font-medium">Onaylamadan önce zorunlu</p>
              <p className="text-xs mt-0.5">
                Proje, pozisyon, yevmiye ve işe giriş tarihi olmadan başvuru onaylanamaz.
                Personel, başvuruda belirlediği PIN ile T.C. kimlik numarasından giriş yapar.
              </p>
            </div>
            <p className="text-sm font-medium text-slate-800">Yönetici alanları *</p>
            <div>
              <label className={labelClass}>Proje *</label>
              <select
                className={inputClass}
                value={form.projectId}
                onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                required
              >
                <option value="">Seçin</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Pozisyon *</label>
              <input
                className={inputClass}
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Günlük yevmiye (₺) *</label>
              <input
                type="number"
                className={inputClass}
                value={form.daily_wage}
                onChange={(e) => setForm({ ...form, daily_wage: e.target.value })}
                min={0}
                required
              />
            </div>
            <div>
              <label className={labelClass}>İşe giriş *</label>
              <input
                type="date"
                className={inputClass}
                value={form.hire_date}
                onChange={(e) => setForm({ ...form, hire_date: e.target.value })}
                required
              />
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <button type="submit" className={btnPrimary} disabled={loading || !adminFormValid}>
                <FiCheck className="w-4 h-4" />
                Onayla ve kaydet
              </button>
              <button type="button" className={btnSecondary} onClick={handleReject} disabled={loading}>
                <FiX className="w-4 h-4" />
                Reddet
              </button>
            </div>
          </form>
        </div>
      )}

      <p className="text-sm text-slate-500">
        <Link href="/admin-panel" className="text-blue-700 hover:underline">
          ← Proje listesine dön
        </Link>
      </p>
    </div>
  );
}

export default function BasvuruOnayPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Yükleniyor…</div>}>
      <BasvuruOnayContent />
    </Suspense>
  );
}
