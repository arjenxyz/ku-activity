'use client';


import { useCallback, useEffect, useState } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import Link from 'next/link';
import { ContractAcceptanceBlock } from '@/components/contracts/ContractAcceptanceBlock';
import { ContractEmailVerificationModal } from '@/components/contracts/ContractEmailVerificationModal';
import { PersonnelLoginLayout } from '@/components/personnel/PersonnelLoginLayout';
import { PendingApplicationWaitingScreen } from '@/components/personnel/PendingApplicationWaitingScreen';
import { ApplicationApprovedScreen } from '@/components/personnel/ApplicationApprovedScreen';
import { ApplicationRejectedScreen } from '@/components/personnel/ApplicationRejectedScreen';
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
  hasLegacyPendingCookieFlag,
  loadPendingRegistration,
  savePendingRegistration,
  type PendingRegistration,
} from '@/lib/registration-pending-storage';

/** Onay kontrolü — 15 sn yeterli; sekme arka plandayken durur (Vercel/Supabase kotası) */
const STATUS_POLL_MS = 15_000;

import {
  personnelAuthDividerClass,
  personnelAuthInfoBannerClass,
  personnelAuthInputClass,
  personnelAuthLabelClass,
  personnelAuthLinkClass,
  personnelAuthMutedTextClass,
  personnelAuthPrimaryBtnClass,
  personnelAuthSecondaryBtnClass,
  personnelAuthSectionClass,
  personnelAuthSectionTitleClass,
  personnelAuthStepActiveClass,
  personnelAuthStepDisabledClass,
  personnelAuthStepIdleClass,
} from '@/lib/personnel-auth-ui';
import { formatString } from '@/lib/strings/format';

const inputClass = personnelAuthInputClass;
const labelClass = personnelAuthLabelClass;
const sectionTitleClass = personnelAuthSectionTitleClass;

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

  const strings = useRegistryStrings('app/personnel-panel/basvuru/page');
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
  const normalizedIdentity = normalizeIdentityNumber('tc', form.tc_kimlik);
  const isStep1Complete =
    form.first_name.trim().length > 0 &&
    form.last_name.trim().length > 0 &&
    validateIdentityNumber('tc', normalizedIdentity) &&
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
        if (!cancelled && hasLegacyPendingCookieFlag()) {
          window.location.replace('/personnel-panel/login');
          return;
        }
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
    body.append('identityType', 'tc');
    body.append('identityNumber', normalizedIdentity);
    body.append('tcKimlik', normalizedIdentity);
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
      setError(strings.contractsRequiredError);
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
      identityType: 'tc',
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
      setError(strings.formDataError);
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

  const handlePendingSignOut = () => {
    clearPendingRegistration();
    window.location.assign('/personnel-panel/login');
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
      <PersonnelLoginLayout title={strings.bootstrapTitle} subtitle={strings.bootstrapLoading}>
        <div className="flex justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      </PersonnelLoginLayout>
    );
  }

  if (result && status === 'pending') {
    return (
      <PendingApplicationWaitingScreen
        approvalUrl={result.approvalUrl}
        verificationCode={result.verificationCode}
        onSignOut={handlePendingSignOut}
      />
    );
  }

  if (result && status === 'approved') {
    const loginHref = result.identityNumber
      ? `/personnel-panel/login?tc=${encodeURIComponent(result.identityNumber.replace(/\D/g, '').slice(0, 11))}`
      : result.tcKimlik
      ? `/personnel-panel/login?tc=${encodeURIComponent(result.tcKimlik.replace(/\D/g, '').slice(0, 11))}`
      : '/personnel-panel/login';

    return (
      <ApplicationApprovedScreen loginHref={loginHref} position={approvedPosition} />
    );
  }

  if (status === 'rejected') {
    return <ApplicationRejectedScreen onNewApplication={startNewApplication} />;
  }

  return (
    <PersonnelLoginLayout
      size="wide"
      alignTop
      compact
      screenLabel={strings.screenLabel}
      title={strings.title}
      subtitle=""
    >
      {error && <AuthAlert type="error" message={error} tone="personnel" />}

      <p className={personnelAuthInfoBannerClass}>
        {strings.infoBannerPrefix}{' '}
        <Link href="/personnel-panel/login" className={`${personnelAuthLinkClass} underline underline-offset-2`}>
          {strings.infoBannerLink}
        </Link>{' '}
        {strings.infoBannerSuffix}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 1 as RegistrationStep, label: strings.steps.basic },
            { id: 2 as RegistrationStep, label: strings.steps.other },
            { id: 3 as RegistrationStep, label: strings.steps.contract },
          ].map((step) => (
            <button
              key={step.id}
              type="button"
              onClick={() => goToStep(step.id)}
              disabled={!canOpenStep(step.id)}
              className={`px-3 py-2.5 text-xs font-semibold transition-colors ${
                activeStep === step.id
                  ? personnelAuthStepActiveClass
                  : canOpenStep(step.id)
                    ? personnelAuthStepIdleClass
                    : personnelAuthStepDisabledClass
              }`}
            >
              {step.id}. {step.label}
            </button>
          ))}
        </div>

        {activeStep === 1 && (
          <section className={personnelAuthSectionClass}>
            <h2 className={sectionTitleClass}>{strings.sections.basicInfo}</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{strings.labels.firstName}</label>
                <input
                  className={inputClass}
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: toTurkishUpper(e.target.value) })}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>{strings.labels.lastName}</label>
                <input
                  className={inputClass}
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: toTurkishUpper(e.target.value) })}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>{strings.labels.tcKimlik}</label>
                <input
                  className={inputClass}
                  data-sensitive-capture
                  inputMode="numeric"
                  maxLength={11}
                  value={form.tc_kimlik}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      tc_kimlik: e.target.value.replace(/\D/g, '').slice(0, 11),
                    })
                  }
                  placeholder={strings.tcKimlikPlaceholder}
                  required
                />
                <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                  {strings.tcKimlikHint}
                </p>
              </div>
              <div>
                <label className={labelClass} htmlFor="basvuru-phone">
                  {strings.labels.phone}
                </label>
                <TurkishPhoneInput
                  id="basvuru-phone"
                  value={form.phone}
                  onChange={(phone) => setForm({ ...form, phone })}
                  allowCountryCodeSelect
                  placeholder={strings.phonePlaceholder}
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
          </section>
        )}

        {activeStep === 2 && (
          <div className="space-y-5">
            <section className={personnelAuthSectionClass}>
              <h2 className={sectionTitleClass}>{strings.sections.otherInfo}</h2>
              <div>
                <label className={labelClass}>{strings.labels.email}</label>
                <input
                  type="email"
                  className={inputClass}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
                <p className={personnelAuthMutedTextClass}>
                  {strings.emailHint}
                </p>
              </div>

              <div>
                <label className={labelClass}>{strings.labels.iban}</label>
                <TurkishIbanInput
                  className={inputClass}
                  value={form.iban}
                  onChange={(iban) => setForm({ ...form, iban })}
                  required
                />
                <p className={`${personnelAuthMutedTextClass} text-[11px]`}>
                  {strings.ibanHint}
                </p>
              </div>

              <h3 className={sectionTitleClass}>{strings.sections.loginSecurity}</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{strings.labels.pin}</label>
                <input
                  type="password"
                  className={inputClass}
                  data-sensitive-capture
                  inputMode="numeric"
                  maxLength={PERSONNEL_PIN_LENGTH}
                  value={form.pin}
                  onChange={(e) => setForm({ ...form, pin: sanitizePersonnelPinInput(e.target.value) })}
                  autoComplete="new-password"
                  required
                />
                <p className={personnelAuthMutedTextClass}>
                  {formatString(strings.pinHint, { pinLength: PERSONNEL_PIN_LENGTH })}
                </p>
              </div>
              <div>
                <label className={labelClass}>{strings.labels.pinConfirm}</label>
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
              appearance="glass"
              initialAcceptances={initialContractAcceptances}
              onAllAccepted={handleAllContractsAccepted}
              onIncomplete={handleContractsIncomplete}
            />

            {contractsReady && (
              <p className="text-xs text-white/55 leading-relaxed">
                {strings.contractsReadyHintBefore}
                <strong>{strings.contractsReadyHintBold}</strong>
                {strings.contractsReadyHintAfter}
              </p>
            )}
          </div>
        )}

        <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4 ${personnelAuthDividerClass}`}>
          <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
            {activeStep > 1 && (
              <button
                type="button"
                onClick={() => setActiveStep((prev) => (prev - 1) as RegistrationStep)}
                className={`w-1/3 sm:w-auto ${personnelAuthSecondaryBtnClass}`}
              >
                {strings.backButton}
              </button>
            )}
            {activeStep < 3 ? (
              <button
                type="button"
                onClick={() => {
                  if (activeStep === 1 && !isStep1Complete) {
                    setError(strings.step1IncompleteError);
                    return;
                  }
                  if (activeStep === 2 && !isStep2Complete) {
                    setError(strings.step2IncompleteError);
                    return;
                  }
                  setError('');
                  setActiveStep((prev) => (prev + 1) as RegistrationStep);
                }}
                className={`flex-1 sm:w-auto px-8 py-3 ${personnelAuthPrimaryBtnClass}`}
              >
                {strings.continueButton}
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || !contractsReady}
                className={`flex-1 sm:w-auto sm:min-w-[200px] px-8 py-3 ${personnelAuthPrimaryBtnClass}`}
              >
                {strings.submitButton}
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
