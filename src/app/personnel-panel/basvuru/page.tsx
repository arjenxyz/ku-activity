'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { FiShield } from 'react-icons/fi';
import { ContractAcceptanceBlock } from '@/components/contracts/ContractAcceptanceBlock';
import { ContractEmailVerificationModal } from '@/components/contracts/ContractEmailVerificationModal';
import { EmployeePhotoPicker } from '@/components/employee/EmployeePhotoPicker';
import { PersonnelLoginLayout } from '@/components/personnel/PersonnelLoginLayout';
import { AuthAlert } from '@/components/auth/AuthAlerts';
import { BirthDatePicker } from '@/components/forms/BirthDatePicker';
import { TurkishPhoneInput } from '@/components/forms/TurkishPhoneInput';
import { validateRegistrationDraft } from '@/lib/registration-draft-validation';
import { formatFullName } from '@/lib/format';
import {
  PERSONNEL_PIN_LENGTH,
  sanitizePersonnelPinInput,
  validatePersonnelPinMatch,
} from '@/lib/personnel-pin';
import {
  clearRegistrationFormDraft,
  loadRegistrationDraftPhoto,
  loadRegistrationFormDraft,
  saveRegistrationDraftPhoto,
  saveRegistrationFormDraft,
} from '@/lib/registration-form-draft-storage';
import {
  clearPendingRegistration,
  loadPendingRegistration,
  savePendingRegistration,
  type PendingRegistration,
} from '@/lib/registration-pending-storage';

const RegistrationQrCode = dynamic(
  () =>
    import('@/components/registration/RegistrationQrCode').then((m) => m.RegistrationQrCode),
  {
    ssr: false,
    loading: () => (
      <div className="w-[220px] h-[220px] bg-slate-100 rounded-xl animate-pulse mx-auto" />
    ),
  }
);

/** Onay kontrolü — 15 sn yeterli; sekme arka plandayken durur (Vercel/Supabase kotası) */
const STATUS_POLL_MS = 15_000;

const inputClass =
  'block w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500';
const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';
const sectionTitleClass =
  'text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3';
const panelClass =
  'rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 p-4 sm:p-5';

type RegistrationStatus = 'pending' | 'approved' | 'rejected' | string;

type StatusPayload = {
  status: RegistrationStatus;
  email?: string;
  position?: string | null;
};

async function fetchRegistrationStatus(code: string): Promise<StatusPayload | null> {
  const res = await fetch(
    `/api/public/personnel-registration/status?kod=${encodeURIComponent(code)}`
  );
  if (!res.ok) return null;
  return res.json() as Promise<StatusPayload>;
}

export default function PersonnelApplicationPage() {
  const [bootstrapping, setBootstrapping] = useState(true);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    tc_kimlik: '',
    birth_date: '',
    iban: '',
    pin: '',
    pin_confirm: '',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<PendingRegistration | null>(null);
  const [status, setStatus] = useState<RegistrationStatus | null>(null);
  const [approvedPosition, setApprovedPosition] = useState<string | null>(null);
  const [contractsReady, setContractsReady] = useState(false);
  const [contractAcceptances, setContractAcceptances] = useState<
    Array<{ contractId: string; version: number }>
  >([]);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyFormData, setVerifyFormData] = useState<FormData | null>(null);
  const [initialContractAcceptances, setInitialContractAcceptances] = useState<
    Array<{ contractId: string; version: number }> | undefined
  >(undefined);
  const [showDraftNotice, setShowDraftNotice] = useState(false);

  const handleAllContractsAccepted = useCallback(
    (acceptances: Array<{ contractId: string; version: number }>) => {
      setContractAcceptances(acceptances);
      setContractsReady(true);
    },
    []
  );

  const handleContractsIncomplete = useCallback(() => {
    setContractsReady(false);
  }, []);

  const applyStatus = useCallback((payload: StatusPayload | null) => {
    if (!payload) return;
    setStatus(payload.status);
    if (payload.status === 'approved') {
      setApprovedPosition(payload.position ?? null);
      clearPendingRegistration();
      void clearRegistrationFormDraft();
    }
    if (payload.status === 'rejected') {
      clearPendingRegistration();
    }
  }, []);

  const refreshStatus = useCallback(
    async (code: string) => {
      const next = await fetchRegistrationStatus(code);
      if (next) applyStatus(next);
      return next;
    },
    [applyStatus]
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const restoreFormDraft = async () => {
        const draft = loadRegistrationFormDraft();
        const photo = await loadRegistrationDraftPhoto();
        if (cancelled) return;
        if (draft) {
          setForm(draft.form);
          setContractAcceptances(draft.contractAcceptances);
          setInitialContractAcceptances(draft.contractAcceptances);
          setShowDraftNotice(true);
        }
        if (photo) setPhotoFile(photo);
      };

      const saved = loadPendingRegistration();
      if (!saved) {
        await restoreFormDraft();
        if (!cancelled) setBootstrapping(false);
        return;
      }

      const next = await fetchRegistrationStatus(saved.verificationCode);
      if (cancelled) return;

      if (!next) {
        clearPendingRegistration();
        await restoreFormDraft();
        setBootstrapping(false);
        return;
      }

      if (next.status === 'rejected') {
        clearPendingRegistration();
        setResult(saved);
        setStatus('rejected');
        setBootstrapping(false);
        return;
      }

      if (next.status === 'approved') {
        clearPendingRegistration();
        void clearRegistrationFormDraft();
        setResult(saved);
        setStatus('approved');
        setApprovedPosition(next.position ?? null);
        setBootstrapping(false);
        return;
      }

      setResult(saved);
      setStatus(next.status);
      setBootstrapping(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!result?.verificationCode || status !== 'pending') return;

    const code = result.verificationCode;
    let timer: ReturnType<typeof setInterval> | null = null;

    const tick = () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      void refreshStatus(code);
    };

    const start = () => {
      if (timer) return;
      timer = setInterval(tick, STATUS_POLL_MS);
    };

    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        void refreshStatus(code);
        start();
      }
    };

    void refreshStatus(code);
    start();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [result?.verificationCode, status, refreshStatus]);

  useEffect(() => {
    if (bootstrapping || result) return;

    const timer = window.setTimeout(() => {
      saveRegistrationFormDraft({ form, contractAcceptances });
      if (photoFile) {
        void saveRegistrationDraftPhoto(photoFile);
      }
    }, 500);

    return () => window.clearTimeout(timer);
  }, [form, contractAcceptances, photoFile, bootstrapping, result]);

  const buildFormData = (): FormData | null => {
    if (!photoFile) return null;
    const body = new FormData();
    body.append('firstName', form.first_name.trim());
    body.append('lastName', form.last_name.trim());
    body.append('email', form.email.trim());
    body.append('phone', form.phone);
    body.append('tcKimlik', form.tc_kimlik);
    body.append('birthDate', form.birth_date);
    body.append('iban', form.iban);
    body.append('pin', form.pin);
    body.append('contractAcceptances', JSON.stringify(contractAcceptances));
    body.append('photo', photoFile);
    return body;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!photoFile) {
      setError('Lütfen selfie ile kendi fotoğrafınızı çekin.');
      return;
    }
    if (!contractsReady || contractAcceptances.length === 0) {
      setError('Başvuruyu göndermeden önce tüm sözleşmeleri sonuna kadar okuyup onaylayın.');
      return;
    }
    const pinError = validatePersonnelPinMatch(form.pin, form.pin_confirm);
    if (pinError) {
      setError(pinError);
      return;
    }
    const draftError = validateRegistrationDraft({
      firstName: form.first_name,
      lastName: form.last_name,
      email: form.email,
      phone: form.phone,
      tcKimlik: form.tc_kimlik,
      birthDate: form.birth_date,
      iban: form.iban,
      pin: form.pin,
    });
    if (draftError) {
      setError(draftError);
      return;
    }

    const data = buildFormData();
    if (!data) {
      setError('Form verileri hazırlanamadı.');
      return;
    }

    setVerifyFormData(data);
    setVerifyModalOpen(true);
  };

  const handleVerificationSuccess = (pending: PendingRegistration) => {
    setVerifyModalOpen(false);
    setVerifyFormData(null);
    void clearRegistrationFormDraft();
    savePendingRegistration(pending);
    setResult(pending);
    setStatus('pending');
    setLoading(false);
    setShowDraftNotice(false);
    setInitialContractAcceptances(undefined);
  };

  const startNewApplication = () => {
    clearPendingRegistration();
    void clearRegistrationFormDraft();
    setResult(null);
    setStatus(null);
    setError('');
    setForm({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      tc_kimlik: '',
      birth_date: '',
      iban: '',
      pin: '',
      pin_confirm: '',
    });
    setPhotoFile(null);
    setContractAcceptances([]);
    setContractsReady(false);
    setInitialContractAcceptances(undefined);
    setShowDraftNotice(false);
  };

  if (bootstrapping) {
    return (
      <PersonnelLoginLayout title="Başvuru" subtitle="Yükleniyor…">
        <div className="flex justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      </PersonnelLoginLayout>
    );
  }

  if (result && status === 'pending') {
    return (
      <PersonnelLoginLayout
        size="wide"
        alignTop
        title="Başvurunuz Bekliyor"
        subtitle="Yöneticiniz onaylayana kadar bu ekranı açık tutun veya tekrar bu sayfaya gelin."
      >
        <div className="space-y-6">
          {result.reused && (
            <p className="text-sm text-blue-700 bg-blue-50 rounded-lg px-3 py-2 text-center">
              Bekleyen başvurunuz devam ediyor; aynı kod geçerlidir.
            </p>
          )}
          <div className="lg:grid lg:grid-cols-2 lg:gap-10 lg:items-center">
            <div className="flex justify-center lg:justify-end">
              <RegistrationQrCode value={result.approvalUrl} />
            </div>
            <div className="space-y-4 text-center lg:text-left mt-6 lg:mt-0">
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Onay bekleniyor — bu sayfayı kapatıp tekrar açsanız bile QR kodunuz burada kalır.
              </div>
              <div className="rounded-xl bg-slate-900 text-white py-4 px-6">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Başvuru Kodu</p>
                <p className="text-2xl font-bold tracking-widest">{result.verificationCode}</p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Bu ekranı yöneticinize gösterin. Onay sonrası size giriş bilgileri verilecektir.
              </p>
            </div>
          </div>
        </div>
      </PersonnelLoginLayout>
    );
  }

  if (result && status === 'approved') {
    const loginHref = result.tcKimlik
      ? `/personnel-panel/login?tc=${encodeURIComponent(result.tcKimlik)}`
      : '/personnel-panel/login';

    return (
      <PersonnelLoginLayout
        size="wide"
        title="Hesabınız Aktif"
        subtitle="Yönetici onayı tamamlandı — hemen giriş yapabilirsiniz."
      >
        <div className="space-y-6 text-center max-w-lg mx-auto">
          <AuthAlert
            type="success"
            message="Başvurunuz onaylandı ve personel kaydınız oluşturuldu. Sistem şu an aktif."
          />
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-left space-y-2">
            {approvedPosition && (
              <p>
                <span className="text-slate-500">Pozisyon:</span>{' '}
                <strong className="text-slate-900">{approvedPosition}</strong>
              </p>
            )}
            <p className="text-slate-600">
              <strong>T.C. kimlik numaranız</strong> ve başvuruda belirlediğiniz{' '}
              <strong>PIN</strong> ile giriş yapın.
            </p>
          </div>
          <Link
            href={loginHref}
            className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Personel paneline giriş yap
          </Link>
        </div>
      </PersonnelLoginLayout>
    );
  }

  if (result && status === 'rejected') {
    return (
      <PersonnelLoginLayout title="Başvuru Reddedildi" subtitle="Yöneticinizle görüşüp yeniden başvurabilirsiniz.">
        <div className="space-y-6 text-center">
          <AuthAlert type="error" message="Başvurunuz reddedildi. Yöneticinizle iletişime geçin." />
          <button
            type="button"
            onClick={startNewApplication}
            className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Yeni başvuru yap
          </button>
        </div>
      </PersonnelLoginLayout>
    );
  }

  return (
    <PersonnelLoginLayout
      size="wide"
      alignTop
      title="Personel Başvurusu"
      subtitle="Bilgilerinizi girin; yönetici onayından sonra sisteme alınacaksınız."
    >
      {error && <AuthAlert type="error" message={error} />}

      {showDraftNotice && (
        <div className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 text-sm text-emerald-900 dark:text-emerald-100">
          <p>Kaldığınız yerden devam ediyorsunuz — bilgileriniz bu cihazda saklandı.</p>
          <button
            type="button"
            onClick={() => setShowDraftNotice(false)}
            className="shrink-0 text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:underline"
          >
            Tamam
          </button>
        </div>
      )}

      <div className="mb-5 flex items-start gap-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 p-3 text-xs text-blue-900 dark:text-blue-200 xl:hidden">
        <FiShield className="w-4 h-4 shrink-0 mt-0.5" />
        <p>
          T.C. kimlik, doğum tarihi ve IBAN bilgileriniz sunucuda şifrelenerek saklanır; yalnızca
          yetkili yöneticiler görebilir.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(220px,280px)_minmax(0,1fr)] lg:items-start">
          <section className={panelClass}>
            <h2 className={sectionTitleClass}>Profil fotoğrafı</h2>
            <EmployeePhotoPicker
              variant="selfie"
              layout="stacked"
              name={formatFullName(form.first_name, form.last_name)}
              value={photoFile}
              onChange={setPhotoFile}
              required
            />
            <div className="hidden lg:flex items-start gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-600 text-xs text-slate-600 dark:text-slate-400">
              <FiShield className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
              <p>
                Hassas bilgileriniz şifrelenerek saklanır; yalnızca yetkili yöneticiler
                görebilir.
              </p>
            </div>
          </section>

          <section className="space-y-4 min-w-0 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-4 sm:p-5 lg:border-0 lg:bg-transparent lg:p-0 lg:rounded-none">
            <h2 className={sectionTitleClass}>Kişisel bilgiler</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Ad *</label>
                <input
                  className={inputClass}
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Soyad *</label>
                <input
                  className={inputClass}
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>E-posta *</label>
                <input
                  type="email"
                  className={inputClass}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  Doğrulama kodu bu adrese gönderilir.
                </p>
              </div>
              <div>
                <label className={labelClass} htmlFor="basvuru-phone">
                  Telefon *
                </label>
                <TurkishPhoneInput
                  id="basvuru-phone"
                  value={form.phone}
                  onChange={(phone) => setForm({ ...form, phone })}
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  Türkiye cep numarası; ülke kodu +90 otomatik eklenir.
                </p>
              </div>
              <div>
                <label className={labelClass}>T.C. Kimlik No *</label>
                <input
                  className={inputClass}
                  inputMode="numeric"
                  maxLength={11}
                  value={form.tc_kimlik}
                  onChange={(e) => setForm({ ...form, tc_kimlik: e.target.value.replace(/\D/g, '') })}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <BirthDatePicker
                  value={form.birth_date}
                  onChange={(birth_date) => setForm({ ...form, birth_date })}
                  inputClass={inputClass}
                  labelClass={labelClass}
                  required
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>IBAN *</label>
              <input
                className={inputClass}
                placeholder="TR00 0000 0000 0000 0000 0000 00"
                value={form.iban}
                onChange={(e) => setForm({ ...form, iban: e.target.value.toUpperCase() })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Giriş şifresi (PIN) *</label>
                <input
                  type="password"
                  className={inputClass}
                  inputMode="numeric"
                  maxLength={PERSONNEL_PIN_LENGTH}
                  value={form.pin}
                  onChange={(e) => setForm({ ...form, pin: sanitizePersonnelPinInput(e.target.value) })}
                  autoComplete="new-password"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  {PERSONNEL_PIN_LENGTH} haneli rakam. Panele girişte kullanılacak.
                </p>
              </div>
              <div>
                <label className={labelClass}>PIN tekrar *</label>
                <input
                  type="password"
                  className={inputClass}
                  inputMode="numeric"
                  maxLength={PERSONNEL_PIN_LENGTH}
                  value={form.pin_confirm}
                  onChange={(e) =>
                    setForm({ ...form, pin_confirm: sanitizePersonnelPinInput(e.target.value) })
                  }
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
          </section>
        </div>

        <ContractAcceptanceBlock
          layout="gate"
          initialAcceptances={initialContractAcceptances}
          onAllAccepted={handleAllContractsAccepted}
          onIncomplete={handleContractsIncomplete}
        />

        {contractsReady && (
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed -mt-2">
            Sözleşmeler tamam. <strong>Başvuruyu Gönder</strong> dediğinizde e-postanıza doğrulama
            kodu ve tek tıkla onay bağlantısı gönderilir.
          </p>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
          <p className="text-sm text-gray-500 order-2 sm:order-1">
            Zaten onaylı hesabınız var mı?{' '}
            <Link href="/personnel-panel/login" className="text-blue-600 hover:underline">
              Giriş yapın
            </Link>
          </p>
          <button
            type="submit"
            disabled={loading || !contractsReady}
            className="order-1 sm:order-2 w-full sm:w-auto sm:min-w-[200px] px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50"
          >
            Başvuruyu Gönder
          </button>
        </div>
      </form>

      <ContractEmailVerificationModal
        open={verifyModalOpen}
        formData={verifyFormData}
        onClose={() => {
          if (!loading) {
            setVerifyModalOpen(false);
            setVerifyFormData(null);
          }
        }}
        onFormFieldError={(message) => {
          setVerifyModalOpen(false);
          setVerifyFormData(null);
          setError(message);
        }}
        onSuccess={handleVerificationSuccess}
      />
    </PersonnelLoginLayout>
  );
}
