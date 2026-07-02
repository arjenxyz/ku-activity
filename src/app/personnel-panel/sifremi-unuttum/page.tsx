'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { PersonnelLoginLayout } from '@/components/personnel/PersonnelLoginLayout';
import { SUPPORT_EMAIL } from '@/lib/support-email';

const inputClass =
  'block w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow';

const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';

export default function PersonnelForgotPasswordPage() {
  const [tcKimlik, setTcKimlik] = useState('');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');

  const mailtoHref = useMemo(() => {
    const subject = 'CrewLedger - Personel PIN sifirlama talebi';
    const body = `Merhaba,\n\nPersonel PIN sifirlama talebi olusturmak istiyorum.\n\nAd Soyad: ${
      fullName || '-'
    }\nT.C. Kimlik No: ${tcKimlik || '-'}\nTelefon: ${phone || '-'}\n\nTesekkurler.`;
    return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [fullName, tcKimlik, phone]);

  return (
    <PersonnelLoginLayout
      title="Şifremi unuttum"
      subtitle="Kısa bilgileri doldurun, PIN sıfırlama talebinizi tek tıkla gönderin."
    >
      <form className="space-y-4">
        <div>
          <label htmlFor="forgot-full-name" className={labelClass}>
            Ad Soyad
          </label>
          <input
            id="forgot-full-name"
            className={inputClass}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Adınız Soyadınız"
          />
        </div>

        <div>
          <label htmlFor="forgot-tc" className={labelClass}>
            T.C. Kimlik No
          </label>
          <input
            id="forgot-tc"
            className={inputClass}
            value={tcKimlik}
            onChange={(e) => setTcKimlik(e.target.value.replace(/\D/g, '').slice(0, 11))}
            placeholder="11 haneli T.C. kimlik"
            maxLength={11}
            inputMode="numeric"
          />
        </div>

        <div>
          <label htmlFor="forgot-phone" className={labelClass}>
            Telefon
          </label>
          <input
            id="forgot-phone"
            className={inputClass}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="05xx xxx xx xx"
            inputMode="tel"
          />
        </div>

        <a
          href={mailtoHref}
          className="touch-target w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-6 py-3.5 rounded-xl font-semibold shadow-lg shadow-blue-500/25 transition-all"
        >
          PIN sıfırlama talebi gönder
        </a>
      </form>

      <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
        Hesabınız mı yok?{' '}
        <Link href="/personnel-panel/basvuru" className="text-blue-600 font-semibold hover:underline">
          Başvuru yapın
        </Link>
      </p>
    </PersonnelLoginLayout>
  );
}
