'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ContractAcceptanceBlock } from '@/components/contracts/ContractAcceptanceBlock';
import { ContractEmailVerificationModal } from '@/components/contracts/ContractEmailVerificationModal';
import { PersonnelLoginLayout } from '@/components/personnel/PersonnelLoginLayout';
import { PendingApplicationAccessForm } from '@/components/personnel/PendingApplicationAccessForm';
import { AuthAlert } from '@/components/auth/AuthAlerts';
import { BirthDatePicker } from '@/components/forms/BirthDatePicker';
import { TurkishPhoneInput } from '@/components/forms/TurkishPhoneInput';
import { TurkishIbanInput } from '@/components/forms/TurkishIbanInput';
import { normalizeIdentityNumber, validateIdentityNumber, validateInternationalPhone } from '@/lib/field-encryption';
import { validateRegistrationDraft } from '@/lib/registration-draft-validation';
import {
  PERSONNEL_PIN_LENGTH,
  sanitizePersonnelPinInput,
  validatePersonnelPinMatch,
} from '@/lib/personnel-pin';
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

type RegistrationStatus = 'pending' | 'approved' | 'rejected' | string;

type StatusPayload = {
  status: RegistrationStatus;
  email?: string;
  position?: string | null;
};
type RegistrationStep = 1 | 2 | 3;

function toTurkishUpper(value: string) {
  return value.toLocaleUpperCase('tr-TR');
}

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
    identity_type: 'tc' as 'tc' | 'foreign',
    tc_kimlik: '',
    birth_date: '',
    iban: '',
    pin: '',
    pin_confirm: '',
  });
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
  const [activeStep, setActiveStep] = useState<RegistrationStep>(1);
  const identityLabel = form.identity_type === 'tc' ? 'T.C. Kimlik No' : 'Yabancı Kimlik / Pasaport No';
  const normalizedIdentity = normalizeIdentityNumber(form.identity_type, form.tc_kimlik);
  const isStep1Complete =
    form.first_name.trim().length > 0 &&
    form.last_name.trim().length > 0 &&
    validateIdentityNumber(form.identity_type, normalizedIdentity) &&
    validateInternationalPhone(form.phone) &&
    form.birth_date.trim().length > 0;
  const isStep2Complete =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) &&
    form.iban.trim().length > 0 &&
    form.pin.length === PERSONNEL_PIN_LENGTH &&
    form.pin_confirm.length === PERSONNEL_PIN_LENGTH &&
    !validatePersonnelPinMatch(form.pin, form.pin_confirm);

  const canOpenStep = (step: RegistrationStep) => {
    if (step === 1) return true;
    if (step === 2) return isStep1Complete;
    return isStep1Complete && isStep2Complete;
  };

  const goToStep = (step: RegistrationStep) => {
    if (!canOpenStep(step)) return;
    setError('');
    setActiveStep(step);
  };

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
    }
    if (payload.status === 'rejected') {
      clearPendingRegistration();
    }
  }, []);

  const refreshStatus = useCallback(
    async (code: string) => {
      const next = await fetchRegistrationStatus(code);
      if (!next) {
        clearPendingRegistration();
        setResult(null);
        setStatus('rejected');
        return null;
      }
      applyStatus(next);
      return next;
    },
    [applyStatus]
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const saved = loadPendingRegistration();
      if (!saved) {
        if (!cancelled) setBootstrapping(false);
        return;
      }

      savePendingRegistration(saved);

      const next = await fetchRegistrationStatus(saved.verificationCode);
      if (cancelled) return;

      if (!next) {
        clearPendingRegistration();
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

  const buildFormData = (): FormData | null => {
    const body = new FormData();
    body.append('firstName', form.first_name.trim());
    body.append('lastName', form.last_name.trim());
    body.append('email', form.email.trim());
    body.append('phone', form.phone);
    body.append('identityType', form.identity_type);
    body.append('identityNumber', normalizedIdentity);
    body.append('tcKimlik', form.tc_kimlik);
    body.append('birthDate', form.birth_date);
    body.append('iban', form.iban);
    body.append('pin', form.pin);
    body.append('contractAcceptances', JSON.stringify(contractAcceptances));
    return body;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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
      identityType: form.identity_type,
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
    savePendingRegistration(pending);
    setResult(pending);
    setStatus('pending');
    setLoading(false);
    setInitialContractAcceptances(undefined);
  };

  const handlePendingAccess = (pending: PendingRegistration) => {
    setError('');
    setResult(pending);
    setStatus('pending');
  };

  const handlePendingSignOut = () => {
    clearPendingRegistration();
    setResult(null);
    setStatus(null);
    setError('');
  };

  const startNewApplication = () => {
    clearPendingRegistration();
    setResult(null);
    setStatus(null);
    setError('');
    setForm({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      identity_type: 'tc',
      tc_kimlik: '',
      birth_date: '',
      iban: '',
      pin: '',
      pin_confirm: '',
    });
    setContractAcceptances([]);
    setContractsReady(false);
    setInitialContractAcceptances(undefined);
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
      <PersonnelLoginLayout alignTop compact title="Onay bekleniyor" subtitle="Yönetici onaylayınca bu ekran güncellenir.">
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <RegistrationQrCode value={result.approvalUrl} size={200} />
          </div>
          <div className="rounded-xl bg-slate-900 text-white py-3 px-4">
            <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Başvuru kodu</p>
            <p className="text-xl font-bold font-mono tracking-wider break-all">
              {result.verificationCode}
            </p>
          </div>
          <button
            type="button"
            onClick={handlePendingSignOut}
            className="w-full text-center text-xs text-slate-500 hover:text-slate-700 py-2"
          >
            Bu cihazda çıkış
          </button>
        </div>
      </PersonnelLoginLayout>
    );
  }

  if (result && status === 'approved') {
    const loginHref = (result.identityType ?? 'tc') === 'tc' && result.identityNumber
      ? `/personnel-panel/login?tc=${encodeURIComponent(result.identityNumber)}`
      : result.tcKimlik
      ? `/personnel-panel/login?tc=${encodeURIComponent(result.tcKimlik)}`
      : '/personnel-panel/login';

    return (
      <PersonnelLoginLayout
        title="Hesabınız Aktif"
        subtitle="Yönetici onayı tamamlandı — hemen giriş yapabilirsiniz."
      >
        <div className="space-y-6 text-center">
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

  if (status === 'rejected') {
    return (
      <PersonnelLoginLayout title="Başvuru Reddedildi" subtitle="Yöneticinizle görüşüp yeniden başvurabilirsiniz.">
        <div className="space-y-6 text-center">
          <AuthAlert
            type="error"
            message="Başvurunuz reddedildi. Kayıtlarınız silindi; yeniden başvurabilirsiniz."
          />
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
      compact
      title="Personel Başvurusu"
      subtitle="Bilgilerinizi girin; yönetici onayından sonra sisteme alınacaksınız."
    >
      {error && <AuthAlert type="error" message={error} />}

      <PendingApplicationAccessForm onSuccess={handlePendingAccess} />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 1 as RegistrationStep, label: 'Temel' },
            { id: 2 as RegistrationStep, label: 'Diğer' },
            { id: 3 as RegistrationStep, label: 'Sözleşme' },
          ].map((step) => (
            <button
              key={step.id}
              type="button"
              onClick={() => goToStep(step.id)}
              disabled={!canOpenStep(step.id)}
              className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors ${
                activeStep === step.id
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : canOpenStep(step.id)
                    ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
            >
              {step.id}. {step.label}
            </button>
          ))}
        </div>

        {activeStep === 1 && (
          <section className="space-y-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-4 sm:p-5">
            <h2 className={sectionTitleClass}>Temel bilgiler</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Ad *</label>
                <input
                  className={inputClass}
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: toTurkishUpper(e.target.value) })}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Soyad *</label>
                <input
                  className={inputClass}
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: toTurkishUpper(e.target.value) })}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Kimlik türü *</label>
                <select
                  className={inputClass}
                  value={form.identity_type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      identity_type: e.target.value as 'tc' | 'foreign',
                      tc_kimlik: '',
                    })
                  }
                >
                  <option value="tc">T.C. Kimlik No</option>
                  <option value="foreign">Yabancı Kimlik / Pasaport</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>{identityLabel} *</label>
                <input
                  className={inputClass}
                  inputMode={form.identity_type === 'tc' ? 'numeric' : 'text'}
                  maxLength={form.identity_type === 'tc' ? 11 : 20}
                  value={form.tc_kimlik}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      tc_kimlik:
                        form.identity_type === 'tc'
                          ? e.target.value.replace(/\D/g, '').slice(0, 11)
                          : e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20),
                    })
                  }
                  placeholder={form.identity_type === 'tc' ? '11 haneli T.C. kimlik' : 'Örn: U14523897'}
                  required
                />
                {form.identity_type === 'foreign' && (
                  <p className="text-xs text-slate-500 mt-1">
                    Harf ve rakam kullanabilirsiniz.
                  </p>
                )}
              </div>
              <div>
                <label className={labelClass} htmlFor="basvuru-phone">
                  Telefon *
                </label>
                <TurkishPhoneInput
                  id="basvuru-phone"
                  value={form.phone}
                  onChange={(phone) => setForm({ ...form, phone })}
                  allowCountryCodeSelect
                  placeholder="123 456 789"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  Ülke kodunu seçip numarayı girin. Yabancı numaralar desteklenir.
                </p>
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
          </section>
        )}

        {activeStep === 2 && (
          <div className="space-y-5">
            <section className="space-y-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-4 sm:p-5">
              <h2 className={sectionTitleClass}>Diğer gerekli bilgiler</h2>
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
                <label className={labelClass}>IBAN *</label>
                <TurkishIbanInput
                  className={inputClass}
                  value={form.iban}
                  onChange={(iban) => setForm({ ...form, iban })}
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Kimlik ve IBAN bilgileriniz şifreli saklanır.
                </p>
              </div>

              <h3 className={sectionTitleClass}>Giriş güvenliği</h3>

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
        )}

        {activeStep === 3 && (
          <div className="space-y-4">
            <ContractAcceptanceBlock
              layout="gate"
              initialAcceptances={initialContractAcceptances}
              onAllAccepted={handleAllContractsAccepted}
              onIncomplete={handleContractsIncomplete}
            />

            {contractsReady && (
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Sözleşmeler tamam. <strong>Başvuruyu Gönder</strong> dediğinizde e-postanıza doğrulama
                kodu ve tek tıkla onay bağlantısı gönderilir.
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4 pt-5 border-t border-slate-200 dark:border-slate-700">
          <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
            {activeStep > 1 && (
              <button
                type="button"
                onClick={() => setActiveStep((prev) => (prev - 1) as RegistrationStep)}
                className="w-1/3 sm:w-auto px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-medium"
              >
                Geri
              </button>
            )}
            {activeStep < 3 ? (
              <button
                type="button"
                onClick={() => {
                  if (activeStep === 1 && !isStep1Complete) {
                    setError('Temel bilgileri eksiksiz doldurmadan diğer adıma geçemezsiniz.');
                    return;
                  }
                  if (activeStep === 2 && !isStep2Complete) {
                    setError('Diğer gerekli bilgileri eksiksiz doldurmadan sözleşme adımına geçemezsiniz.');
                    return;
                  }
                  setError('');
                  setActiveStep((prev) => (prev + 1) as RegistrationStep);
                }}
                className="flex-1 sm:w-auto px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                Devam et
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || !contractsReady}
                className="flex-1 sm:w-auto sm:min-w-[200px] px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50"
              >
                Başvuruyu Gönder
              </button>
            )}
          </div>
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
