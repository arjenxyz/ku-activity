'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { PersonnelLoginLayout } from '@/components/personnel/PersonnelLoginLayout';
import { SUPPORT_EMAIL } from '@/lib/support-email';

import {
  personnelAuthFooterTextClass,
  personnelAuthInputClass,
  personnelAuthLabelClass,
  personnelAuthLinkClass,
  personnelAuthPrimaryBtnClass,
} from '@/lib/personnel-auth-ui';

const inputClass = personnelAuthInputClass;
const labelClass = personnelAuthLabelClass;

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
      screenLabel="Şifremi Unuttum"
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
          className={personnelAuthPrimaryBtnClass}
        >
          PIN sıfırlama talebi gönder
        </a>
      </form>

      <p className={`mt-4 text-center ${personnelAuthFooterTextClass}`}>
        Hesabınız mı yok?{' '}
        <Link href="/personnel-panel/basvuru" className={personnelAuthLinkClass}>
          Başvuru yapın
        </Link>
      </p>
    </PersonnelLoginLayout>
  );
}
