'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiShield } from 'react-icons/fi';
import { EmployeePhotoPicker } from '@/components/employee/EmployeePhotoPicker';
import { PersonnelLoginLayout } from '@/components/personnel/PersonnelLoginLayout';
import { AuthAlert } from '@/components/auth/AuthAlerts';
import { formatFullName } from '@/lib/format';

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

const inputClass =
  'block w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500';
const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';

type Result = {
  verificationCode: string;
  approvalUrl: string;
  reused?: boolean;
};

export default function PersonnelApplicationPage() {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    tc_kimlik: '',
    birth_date: '',
    iban: '',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!result?.verificationCode) return;
    const t = setInterval(async () => {
      const res = await fetch(
        `/api/public/personnel-registration/status?kod=${encodeURIComponent(result.verificationCode)}`
      );
      if (res.ok) {
        const data = await res.json();
        setStatus(data.status);
      }
    }, 5000);
    return () => clearInterval(t);
  }, [result?.verificationCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!photoFile) {
      setError('Lütfen selfie ile kendi fotoğrafınızı çekin.');
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
      body.append('photo', photoFile);

      const res = await fetch('/api/public/personnel-registration', {
        method: 'POST',
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Başvuru gönderilemedi');
      setResult(data);
      setStatus('pending');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <PersonnelLoginLayout
        title="Başvurunuz Alındı"
        subtitle="Yöneticiniz QR kodu okutarak veya başvuru kodunu girerek onaylasın."
      >
        <div className="space-y-6 text-center">
          {result.reused && (
            <p className="text-sm text-blue-700 bg-blue-50 rounded-lg px-3 py-2">
              Bu e-posta için bekleyen başvurunuz zaten vardı; aynı kod geçerlidir.
            </p>
          )}
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
          {status === 'approved' && (
            <AuthAlert
              type="success"
              message="Başvurunuz onaylandı! Yöneticinizin verdiği e-posta ve şifre ile giriş yapabilirsiniz."
            />
          )}
          {status === 'rejected' && (
            <AuthAlert type="error" message="Başvurunuz reddedildi. Yöneticinizle iletişime geçin." />
          )}
          <Link
            href="/personnel-panel/login"
            className="inline-block text-sm text-blue-600 hover:underline"
          >
            Giriş sayfasına dön
          </Link>
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
        <div>
          <label className={labelClass}>Doğum Tarihi *</label>
          <input
            type="date"
            className={inputClass}
            value={form.birth_date}
            onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
            required
          />
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
        <button
          type="submit"
          disabled={loading}
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
