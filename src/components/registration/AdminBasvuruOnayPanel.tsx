'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { FiCheck, FiSearch, FiUser, FiX } from 'react-icons/fi';
import { AlertBanner } from '@/components/project/AlertBanner';
import { ProjectPageHeader } from '@/components/project/ProjectPageHeader';
import { cardClass, btnPrimary, labelClass, inputClass, btnSecondary } from '@/components/project/ui';
import {
  constructionAgeErrorMessage,
  getAgeFromBirthDate,
  isConstructionEligibleBirthDate,
} from '@/lib/age-validation';
import { formatDate } from '@/lib/format';

const QrCameraScanner = dynamic(
  () => import('@/components/registration/QrCameraScanner').then((m) => m.QrCameraScanner),
  {
    ssr: false,
    loading: () => (
      <p className="text-sm text-slate-500 py-6 text-center">Kamera modülü yükleniyor…</p>
    ),
  }
);

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

type Props = {
  projectId: string;
};

export function AdminBasvuruOnayPanel({ projectId }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialKod = searchParams.get('kod') ?? '';

  const [projectName, setProjectName] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState(initialKod);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSensitive, setShowSensitive] = useState(false);
  const [form, setForm] = useState({
    position: '',
    daily_wage: '',
    hire_date: dayjs().format('YYYY-MM-DD'),
  });

  useEffect(() => {
    fetch(`/api/admin/projects/${projectId}`)
      .then((r) => r.json())
      .then((d) => setProjectName(d.project?.name ?? null))
      .catch(() => {});
  }, [projectId]);

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
      setError('Onaylamadan önce pozisyon, yevmiye ve işe giriş tarihini doldurun.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/registrations/${registration.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          position: form.position,
          dailyWage: Number(form.daily_wage),
          hireDate: form.hire_date,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Onay başarısız');
      setSuccess(
        `Personel kaydı aktif. ${data.email} adresi ile hemen giriş yapabilir — PIN bilgisini personele iletin.`
      );
      setRegistration(null);
      setTimeout(() => router.push(`/admin-panel/proje/${projectId}/list`), 1500);
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

  const showPendingForm = registration && registration.status === 'pending';

  return (
    <div className="space-y-5 sm:space-y-6 pb-24 sm:pb-0">
      <ProjectPageHeader
        title="Başvuru Onayı"
        description={
          projectName
            ? `${projectName} — QR kod okutun veya başvuru kodunu girin; onay sonrası personel bu projeye eklenir.`
            : 'QR kod okutun veya başvuru kodunu girin.'
        }
      />

      {error && <AlertBanner type="error" message={error} />}
      {success && <AlertBanner type="success" message={success} />}

      <section className={`${cardClass} p-4 sm:p-5 space-y-4`}>
        <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
          <FiSearch className="w-4 h-4 text-blue-600 shrink-0" />
          Başvuru bul
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/80">
          <QrCameraScanner
            disabled={loading}
            onScan={(code) => {
              setCodeInput(code);
              void lookup(code);
            }}
          />
        </div>

        <div>
          <label htmlFor="basvuru-kod" className={labelClass}>
            veya başvuru kodunu yazın
          </label>
          <div className="mt-1.5 flex flex-col sm:flex-row gap-2">
            <input
              id="basvuru-kod"
              className={`${inputClass} flex-1 uppercase tracking-wide font-mono text-base sm:text-sm min-h-[44px]`}
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              placeholder="ARJ-XXXXXX"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => lookup(codeInput)}
              disabled={loading || !codeInput.trim()}
              className={`${btnPrimary} sm:min-w-[7rem] min-h-[44px] shrink-0`}
            >
              <FiSearch className="w-4 h-4" />
              {loading ? 'Aranıyor…' : 'Bul'}
            </button>
          </div>
        </div>
      </section>

      {showPendingForm && (
        <>
          <section className={`${cardClass} overflow-hidden`}>
            <div className="px-4 sm:px-5 py-4 border-b border-slate-100 bg-slate-50/60">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {registration.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={registration.photoUrl}
                    alt=""
                    className="w-24 h-24 sm:w-20 sm:h-20 mx-auto sm:mx-0 rounded-2xl object-cover border-2 border-white shadow-sm shrink-0"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-20 sm:h-20 mx-auto sm:mx-0 rounded-2xl bg-slate-200 flex items-center justify-center shrink-0">
                    <FiUser className="w-10 h-10 text-slate-400" />
                  </div>
                )}
                <div className="text-center sm:text-left min-w-0 flex-1">
                  <h2 className="font-semibold text-lg text-slate-900 truncate">
                    {registration.firstName} {registration.lastName}
                  </h2>
                  <p className="text-sm text-slate-600 truncate">{registration.email}</p>
                  {registration.phone && (
                    <p className="text-sm text-slate-600">{registration.phone}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-2 font-mono">
                    {registration.verificationCode} · Son{' '}
                    {formatDate(registration.expiresAt.slice(0, 10))}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-4 sm:px-5 py-4 space-y-2 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Kimlik bilgileri
              </p>
              <div className="grid grid-cols-1 gap-2 rounded-xl bg-slate-50 border border-slate-200 p-3">
                <p className="break-all">
                  <span className="text-slate-500">T.C.: </span>
                  {showSensitive
                    ? registration.sensitive.tcKimlik
                    : registration.sensitive.tcKimlikMasked}
                </p>
                <p>
                  <span className="text-slate-500">Doğum: </span>
                  {formatDate(registration.sensitive.birthDate)}
                  {applicantAge !== null && (
                    <span
                      className={
                        birthDateEligible ? ' text-slate-600' : ' text-red-700 font-medium'
                      }
                    >
                      {' '}
                      ({applicantAge} yaş)
                    </span>
                  )}
                </p>
                {!birthDateEligible && (
                  <p className="text-red-700 text-xs font-medium">{constructionAgeErrorMessage()}</p>
                )}
                <p className="break-all">
                  <span className="text-slate-500">IBAN: </span>
                  {showSensitive ? registration.sensitive.iban : registration.sensitive.ibanMasked}
                </p>
                <button
                  type="button"
                  onClick={() => setShowSensitive((v) => !v)}
                  className="text-left text-xs text-blue-700 hover:underline pt-1 min-h-[44px] sm:min-h-0 flex items-center"
                >
                  {showSensitive ? 'Hassas bilgileri gizle' : 'Tam göster (yalnızca onay öncesi)'}
                </button>
              </div>
            </div>
          </section>

          <section className={`${cardClass} p-4 sm:p-5`}>
            <form id="basvuru-onay-form" onSubmit={handleApprove} className="space-y-4">
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950">
                <p className="font-medium">Onay bilgileri</p>
                <p className="text-xs mt-1 leading-relaxed opacity-90">
                  Personel <strong>{projectName ?? 'seçili proje'}</strong> altına eklenecek. Giriş:
                  T.C. kimlik + başvuruda belirlediği PIN.
                </p>
              </div>

              <div>
                <label htmlFor="position" className={labelClass}>
                  Pozisyon *
                </label>
                <input
                  id="position"
                  className={`${inputClass} min-h-[44px]`}
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                  placeholder="Örn. İnşaat işçisi"
                  required
                />
              </div>
              <div>
                <label htmlFor="daily_wage" className={labelClass}>
                  Günlük yevmiye (₺) *
                </label>
                <input
                  id="daily_wage"
                  type="number"
                  inputMode="decimal"
                  className={`${inputClass} min-h-[44px]`}
                  value={form.daily_wage}
                  onChange={(e) => setForm({ ...form, daily_wage: e.target.value })}
                  min={0}
                  required
                />
              </div>
              <div>
                <label htmlFor="hire_date" className={labelClass}>
                  İşe giriş tarihi *
                </label>
                <input
                  id="hire_date"
                  type="date"
                  className={`${inputClass} min-h-[44px]`}
                  value={form.hire_date}
                  onChange={(e) => setForm({ ...form, hire_date: e.target.value })}
                  required
                />
              </div>

              <div className="hidden sm:flex flex-wrap gap-2 pt-2">
                <button type="submit" className={btnPrimary} disabled={loading || !adminFormValid}>
                  <FiCheck className="w-4 h-4" />
                  Onayla ve kaydet
                </button>
                <button
                  type="button"
                  className={btnSecondary}
                  onClick={handleReject}
                  disabled={loading}
                >
                  <FiX className="w-4 h-4" />
                  Reddet
                </button>
              </div>
            </form>
          </section>

          <div className="fixed bottom-0 inset-x-0 z-20 sm:hidden border-t border-slate-200 bg-white/95 backdrop-blur px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
            <div className="grid grid-cols-2 gap-2 max-w-lg mx-auto">
              <button
                type="button"
                className={`${btnSecondary} min-h-[48px] border-red-200 text-red-700 bg-red-50 hover:bg-red-100`}
                onClick={handleReject}
                disabled={loading}
              >
                <FiX className="w-4 h-4" />
                Reddet
              </button>
              <button
                type="submit"
                form="basvuru-onay-form"
                className={`${btnPrimary} min-h-[48px] bg-blue-600 hover:bg-blue-700`}
                disabled={loading || !adminFormValid}
              >
                <FiCheck className="w-4 h-4" />
                Onayla
              </button>
            </div>
          </div>
        </>
      )}

      <p className="text-sm text-slate-500 hidden sm:block">
        <Link
          href={`/admin-panel/proje/${projectId}`}
          className="text-blue-700 hover:underline"
        >
          ← Proje özetine dön
        </Link>
      </p>
    </div>
  );
}
