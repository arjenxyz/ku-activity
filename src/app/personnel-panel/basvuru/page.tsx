'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { FiShield } from 'react-icons/fi';
import { ContractAcceptanceBlock } from '@/components/contracts/ContractAcceptanceBlock';
import { EmployeePhotoPicker } from '@/components/employee/EmployeePhotoPicker';
import { PersonnelLoginLayout } from '@/components/personnel/PersonnelLoginLayout';
import { AuthAlert } from '@/components/auth/AuthAlerts';
import { BirthDatePicker } from '@/components/forms/BirthDatePicker';
import {
  constructionAgeErrorMessage,
  isConstructionEligibleBirthDate,
} from '@/lib/age-validation';
import { formatFullName } from '@/lib/format';
import { validatePersonnelPinMatch } from '@/lib/personnel-pin';
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
      if (next) applyStatus(next);
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

  const handleSubmit = async (e: React.FormEvent) => {
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
    if (!form.birth_date || !isConstructionEligibleBirthDate(form.birth_date)) {
      setError(constructionAgeErrorMessage());
      return;
    }
    const pinError = validatePersonnelPinMatch(form.pin, form.pin_confirm);
    if (pinError) {
      setError(pinError);
      return;
    }

    setLoading(true);
    try {
      const body = new FormData();
      body.append('firstName', form.first_name.trim());
      body.append('lastName', form.last_name.trim());
      body.append('email', form.email.trim());
      if (form.phone) body.append('phone', form.phone);
      body.append('tcKimlik', form.tc_kimlik);
      body.append('birthDate', form.birth_date);
      body.append('iban', form.iban);
      body.append('pin', form.pin);
      body.append('contractAcceptances', JSON.stringify(contractAcceptances));
      body.append('photo', photoFile);

      const res = await fetch('/api/public/personnel-registration', {
        method: 'POST',
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Başvuru gönderilemedi');

      const pending: PendingRegistration = {
        verificationCode: data.verificationCode,
        approvalUrl: data.approvalUrl,
        reused: data.reused,
        tcKimlik: form.tc_kimlik,
      };
      savePendingRegistration(pending);
      setResult(pending);
      setStatus('pending');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const startNewApplication = () => {
    clearPendingRegistration();
    setResult(null);
    setStatus(null);
    setError('');
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
        title="Başvurunuz Bekliyor"
        subtitle="Yöneticiniz onaylayana kadar bu ekranı açık tutun veya tekrar bu sayfaya gelin."
      >
        <div className="space-y-6 text-center">
          {result.reused && (
            <p className="text-sm text-blue-700 bg-blue-50 rounded-lg px-3 py-2">
              Bekleyen başvurunuz devam ediyor; aynı kod geçerlidir.
            </p>
          )}
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Onay bekleniyor — bu sayfayı kapatıp tekrar açsanız bile QR kodunuz burada kalır.
          </div>
          <div className="flex justify-center">
            <RegistrationQrCode value={result.approvalUrl} />
          </div>
          <div className="rounded-xl bg-slate-900 text-white py-4 px-6">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Başvuru Kodu</p>
            <p className="text-2xl font-bold tracking-widest">{result.verificationCode}</p>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Bu ekranı yöneticinize gösterin. Onay sonrası size giriş bilgileri verilecektir.
          </p>
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
      title="Personel Başvurusu"
      subtitle="Bilgilerinizi girin; yönetici onayından sonra sisteme alınacaksınız."
    >
      <div className="mb-4 flex items-start gap-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 p-3 text-xs text-blue-900 dark:text-blue-200">
        <FiShield className="w-4 h-4 shrink-0 mt-0.5" />
        <p>
          T.C. kimlik, doğum tarihi ve IBAN bilgileriniz sunucuda şifrelenerek saklanır; yalnızca
          yetkili yöneticiler görebilir.
        </p>
      </div>

      {error && <AuthAlert type="error" message={error} />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <EmployeePhotoPicker
          variant="selfie"
          name={formatFullName(form.first_name, form.last_name)}
          value={photoFile}
          onChange={setPhotoFile}
          required
        />

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
        </div>
        <div>
          <label className={labelClass}>Telefon</label>
          <input
            type="tel"
            className={inputClass}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
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
        <BirthDatePicker
          value={form.birth_date}
          onChange={(birth_date) => setForm({ ...form, birth_date })}
          inputClass={inputClass}
          labelClass={labelClass}
          required
        />
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
              maxLength={12}
              value={form.pin}
              onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, '') })}
              autoComplete="new-password"
              required
            />
            <p className="text-xs text-slate-500 mt-1">4-12 rakam. Panele girişte kullanılacak.</p>
          </div>
          <div>
            <label className={labelClass}>PIN tekrar *</label>
            <input
              type="password"
              className={inputClass}
              inputMode="numeric"
              maxLength={12}
              value={form.pin_confirm}
              onChange={(e) => setForm({ ...form, pin_confirm: e.target.value.replace(/\D/g, '') })}
              autoComplete="new-password"
              required
            />
          </div>
        </div>

        <ContractAcceptanceBlock
          onAllAccepted={handleAllContractsAccepted}
          onIncomplete={handleContractsIncomplete}
        />

        <button
          type="submit"
          disabled={loading || !contractsReady}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50"
        >
          {loading ? 'Gönderiliyor…' : 'Başvuruyu Gönder'}
        </button>
        <p className="text-center text-sm text-gray-500">
          Zaten onaylı hesabınız var mı?{' '}
          <Link href="/personnel-panel/login" className="text-blue-600 hover:underline">
            Giriş yapın
          </Link>
        </p>
      </form>
    </PersonnelLoginLayout>
  );
}
