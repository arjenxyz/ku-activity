'use client';

import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import {
  FiCalendar,
  FiCheck,
  FiClock,
  FiDollarSign,
  FiEye,
  FiEyeOff,
  FiMail,
  FiPhone,
  FiShield,
  FiUser,
  FiX,
} from 'react-icons/fi';
import { inputClass, labelClass } from '@/components/project/ui';
import {
  constructionAgeErrorMessage,
  getAgeFromBirthDate,
  isConstructionEligibleBirthDate,
} from '@/lib/age-validation';
import { formatDate } from '@/lib/format';
import { registrationStatusMessage } from '@/lib/parse-registration-qr';

export type RegistrationApprovalData = {
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
    identityType?: 'tc' | 'foreign';
    identityNumber?: string;
    tcKimlikMasked: string;
    birthDate: string;
    ibanMasked: string;
    tcKimlik: string;
    iban: string;
  };
};

type ApprovalForm = {
  position: string;
  daily_wage: string;
  hire_date: string;
};

type Props = {
  open: boolean;
  registration: RegistrationApprovalData | null;
  projectName: string | null;
  loading: boolean;
  onClose: () => void;
  onApprove: (data: { position: string; dailyWage: number; hireDate: string }) => Promise<void>;
  onReject: () => Promise<void>;
};

const defaultForm: ApprovalForm = {
  position: '',
  daily_wage: '',
  hire_date: dayjs().format('YYYY-MM-DD'),
};

function statusBadge(status: string) {
  switch (status) {
    case 'pending':
      return {
        label: 'Onay bekliyor',
        className: 'bg-amber-100 text-amber-900 ring-amber-200',
        dot: 'bg-amber-500',
      };
    case 'approved':
      return {
        label: 'Onaylanmış',
        className: 'bg-emerald-100 text-emerald-900 ring-emerald-200',
        dot: 'bg-emerald-500',
      };
    case 'rejected':
      return {
        label: 'Reddedilmiş',
        className: 'bg-red-100 text-red-900 ring-red-200',
        dot: 'bg-red-500',
      };
    case 'expired':
      return {
        label: 'Süresi dolmuş',
        className: 'bg-slate-100 text-slate-700 ring-slate-200',
        dot: 'bg-slate-400',
      };
    default:
      return {
        label: status,
        className: 'bg-slate-100 text-slate-700 ring-slate-200',
        dot: 'bg-slate-400',
      };
  }
}

export function AdminBasvuruOnayModal({
  open,
  registration,
  projectName,
  loading,
  onClose,
  onApprove,
  onReject,
}: Props) {
  const [form, setForm] = useState<ApprovalForm>(defaultForm);
  const [showSensitive, setShowSensitive] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const isPending = registration?.status === 'pending';
  const statusMsg = registration ? registrationStatusMessage(registration.status) : null;
  const badge = registration ? statusBadge(registration.status) : null;

  const birthDateEligible = registration
    ? isConstructionEligibleBirthDate(registration.sensitive.birthDate)
    : true;
  const applicantAge = registration ? getAgeFromBirthDate(registration.sensitive.birthDate) : null;

  const adminFormValid =
    Boolean(form.position.trim()) &&
    Number(form.daily_wage) > 0 &&
    Boolean(form.hire_date) &&
    birthDateEligible;

  useEffect(() => {
    if (!open) return;
    setForm(defaultForm);
    setShowSensitive(false);
    setLocalError(null);
  }, [open, registration?.id]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, loading, onClose]);

  if (!open || !registration || !badge) return null;

  const identityLabel =
    registration.sensitive.identityType === 'foreign'
      ? 'Yabancı Kimlik / Pasaport'
      : 'T.C. Kimlik No';

  const identityValue =
    registration.sensitive.identityType === 'foreign'
      ? showSensitive
        ? registration.sensitive.identityNumber
        : registration.sensitive.identityNumber
      : showSensitive
        ? registration.sensitive.tcKimlik
        : registration.sensitive.tcKimlikMasked;

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!birthDateEligible) {
      setLocalError(constructionAgeErrorMessage());
      return;
    }
    if (!adminFormValid) {
      setLocalError('Pozisyon, yevmiye ve işe giriş tarihini doldurun.');
      return;
    }
    setLocalError(null);
    try {
      await onApprove({
        position: form.position.trim(),
        dailyWage: Number(form.daily_wage),
        hireDate: form.hire_date,
      });
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'Onay başarısız');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="basvuru-onay-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm"
        onClick={() => !loading && onClose()}
        aria-label="Kapat"
      />

      <div className="relative w-full sm:max-w-3xl max-h-[min(96dvh,900px)] flex flex-col bg-white sm:rounded-2xl shadow-2xl shadow-slate-900/20 overflow-hidden">
        {/* Üst başlık */}
        <div className="relative shrink-0 overflow-hidden border-b border-slate-100">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-blue-950" />
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.5' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          <div className="relative px-4 sm:px-6 pt-4 pb-5 sm:pt-5 sm:pb-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${badge.className}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                  {badge.label}
                </span>
                <h2
                  id="basvuru-onay-modal-title"
                  className="mt-2 text-lg sm:text-xl font-bold text-white truncate"
                >
                  Başvuru inceleme
                </h2>
                <p className="text-sm text-slate-300 mt-0.5 font-mono">{registration.verificationCode}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-50"
                aria-label="Modalı kapat"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 flex items-center gap-4">
              {registration.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={registration.photoUrl}
                  alt=""
                  className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-cover ring-2 ring-white/30 shadow-lg shrink-0"
                />
              ) : (
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-white/10 flex items-center justify-center ring-2 ring-white/20 shrink-0">
                  <FiUser className="w-8 h-8 text-white/70" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-lg sm:text-xl font-semibold text-white truncate">
                  {registration.firstName} {registration.lastName}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-300">
                  <span className="inline-flex items-center gap-1 truncate">
                    <FiMail className="w-3.5 h-3.5 shrink-0" />
                    {registration.email}
                  </span>
                  {registration.phone && (
                    <span className="inline-flex items-center gap-1">
                      <FiPhone className="w-3.5 h-3.5 shrink-0" />
                      {registration.phone}
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-slate-400 inline-flex items-center gap-1">
                  <FiClock className="w-3.5 h-3.5" />
                  Başvuru {formatDate(registration.createdAt.slice(0, 10))} · Son{' '}
                  {formatDate(registration.expiresAt.slice(0, 10))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* İçerik */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {statusMsg && (
            <div className="mx-4 sm:mx-6 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              {statusMsg}
            </div>
          )}

          {localError && (
            <div className="mx-4 sm:mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {localError}
            </div>
          )}

          <div className="p-4 sm:p-6 grid lg:grid-cols-2 gap-5 sm:gap-6">
            {/* Sol: kimlik bilgileri */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <FiShield className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Kimlik & ödeme</h3>
                  <p className="text-xs text-slate-500">Onay öncesi doğrulayın</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/80 divide-y divide-slate-200/80 overflow-hidden">
                <div className="px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {identityLabel}
                  </p>
                  <p className="mt-1 text-sm font-mono text-slate-900 break-all">{identityValue}</p>
                </div>
                <div className="px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Doğum tarihi
                  </p>
                  <p className="mt-1 text-sm text-slate-900">
                    {formatDate(registration.sensitive.birthDate)}
                    {applicantAge !== null && (
                      <span
                        className={
                          birthDateEligible ? ' text-slate-500' : ' text-red-700 font-semibold'
                        }
                      >
                        {' '}
                        · {applicantAge} yaş
                      </span>
                    )}
                  </p>
                  {!birthDateEligible && (
                    <p className="mt-2 text-xs font-medium text-red-700">
                      {constructionAgeErrorMessage()}
                    </p>
                  )}
                </div>
                <div className="px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    IBAN
                  </p>
                  <p className="mt-1 text-sm font-mono text-slate-900 break-all">
                    {showSensitive ? registration.sensitive.iban : registration.sensitive.ibanMasked}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSensitive((v) => !v)}
                className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700 hover:text-blue-800"
              >
                {showSensitive ? (
                  <>
                    <FiEyeOff className="w-3.5 h-3.5" />
                    Hassas bilgileri gizle
                  </>
                ) : (
                  <>
                    <FiEye className="w-3.5 h-3.5" />
                    Tam kimlik ve IBAN göster
                  </>
                )}
              </button>
            </section>

            {/* Sağ: onay formu */}
            {isPending ? (
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                    <FiCheck className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Proje ataması</h3>
                    <p className="text-xs text-slate-500">
                      {projectName ?? 'Seçili proje'} altına eklenecek
                    </p>
                  </div>
                </div>

                <form id="basvuru-onay-modal-form" onSubmit={handleApprove} className="space-y-4">
                  <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm text-blue-950">
                    Personel girişi: kimlik numarası + başvuruda belirlediği PIN.
                  </div>

                  <div>
                    <label htmlFor="modal-position" className={labelClass}>
                      Pozisyon *
                    </label>
                    <div className="relative">
                      <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        id="modal-position"
                        className={`${inputClass} pl-9 min-h-[44px]`}
                        value={form.position}
                        onChange={(e) => setForm({ ...form, position: e.target.value })}
                        placeholder="Örn. Demir işçisi, Kalıpçı"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="modal-daily-wage" className={labelClass}>
                      Günlük yevmiye (₺) *
                    </label>
                    <div className="relative">
                      <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        id="modal-daily-wage"
                        type="number"
                        inputMode="decimal"
                        className={`${inputClass} pl-9 min-h-[44px]`}
                        value={form.daily_wage}
                        onChange={(e) => setForm({ ...form, daily_wage: e.target.value })}
                        min={0}
                        step="0.01"
                        placeholder="1500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="modal-hire-date" className={labelClass}>
                      İşe giriş tarihi *
                    </label>
                    <div className="relative">
                      <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        id="modal-hire-date"
                        type="date"
                        className={`${inputClass} pl-9 min-h-[44px]`}
                        value={form.hire_date}
                        onChange={(e) => setForm({ ...form, hire_date: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </form>
              </section>
            ) : (
              <section className="flex flex-col justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
                <p className="text-sm text-slate-600">
                  Bu başvuru üzerinde işlem yapılamaz. Yeni bir tarama yapın veya personelin güncel
                  başvuru kodunu isteyin.
                </p>
              </section>
            )}
          </div>
        </div>

        {/* Alt aksiyonlar */}
        <div className="shrink-0 border-t border-slate-100 bg-white px-4 sm:px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {isPending ? (
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <button
                type="button"
                onClick={() => void onReject()}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 min-h-[48px] px-5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100 disabled:opacity-50 transition-colors"
              >
                <FiX className="w-4 h-4" />
                Reddet
              </button>
              <button
                type="submit"
                form="basvuru-onay-modal-form"
                disabled={loading || !adminFormValid}
                className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-colors"
              >
                <FiCheck className="w-4 h-4" />
                {loading ? 'Kaydediliyor…' : 'Onayla ve kaydet'}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto sm:ml-auto inline-flex items-center justify-center gap-2 min-h-[48px] px-6 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Kapat
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
