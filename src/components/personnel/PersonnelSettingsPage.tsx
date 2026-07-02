'use client';

import { useMemo, useRef, useState } from 'react';
import {
  FiBriefcase,
  FiCamera,
  FiChevronLeft,
  FiChevronRight,
  FiCreditCard,
  FiImage,
  FiLock,
  FiLogOut,
  FiMail,
  FiPhone,
  FiSettings,
  FiShield,
  FiUser,
} from 'react-icons/fi';
import { EmployeeAvatar } from '@/components/employee/EmployeeAvatar';
import { PersonnelContractsSection } from '@/components/personnel/PersonnelContractsSection';
import { PersonnelDisplaySettings } from '@/components/personnel/PersonnelDisplaySettings';
import { PersonnelPasswordModal } from '@/components/personnel/PersonnelPasswordModal';
import { PersonnelProjectCard } from '@/components/personnel/PersonnelProjectCard';
import { formatDate, formatMoney } from '@/lib/format';
import { formatTurkishPhoneNational } from '@/lib/field-encryption';
import type { PersonnelEmployee } from '@/lib/personnel-api';

type Props = {
  employee: PersonnelEmployee;
  onLogout: () => void;
};

type SettingsSectionId =
  | 'home'
  | 'personal'
  | 'contact'
  | 'bank'
  | 'work'
  | 'contracts'
  | 'security'
  | 'app';

function formatIbanDisplay(iban: string | null | undefined) {
  if (!iban) return '—';
  const clean = iban.replace(/\s/g, '').toUpperCase();
  return clean.replace(/(.{4})/g, '$1 ').trim();
}

function formatPhoneDisplay(phone: string | null | undefined) {
  if (!phone) return '—';
  const digits = phone.replace(/\D/g, '');
  const national = digits.startsWith('90') ? digits.slice(2) : digits;
  if (national.length === 10) return formatTurkishPhoneNational(national);
  return phone;
}

export function PersonnelSettingsPage({ employee, onLogout }: Props) {
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<SettingsSectionId>('home');
  const [photoUrl, setPhotoUrl] = useState(employee.photo_url ?? null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const firstName = employee.first_name || employee.name.split(' ')[0] || '—';
  const lastName = employee.last_name || employee.name.split(' ').slice(1).join(' ') || '—';

  const uploadPhoto = async (file: File | null) => {
    if (!file) return;
    setPhotoError(null);
    setPhotoBusy(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/personnel/me/photo', {
        method: 'POST',
        credentials: 'same-origin',
        body,
      });
      const data = (await res.json().catch(() => ({}))) as { photoUrl?: string; error?: string };
      if (!res.ok) throw new Error(data.error || 'Fotoğraf yüklenemedi');
      setPhotoUrl(data.photoUrl ?? null);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Fotoğraf yüklenemedi');
    } finally {
      setPhotoBusy(false);
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  const sectionMeta = useMemo(
    () => ({
      home: { title: 'Ayarlar', subtitle: 'Hesabınızı ve uygulama tercihlerinizi yönetin.' },
      personal: { title: 'Kişisel Ayarlar', subtitle: 'Kimlik ve kişisel bilgileriniz.' },
      contact: { title: 'İletişim', subtitle: 'E-posta ve telefon bilgileriniz.' },
      bank: { title: 'Banka Bilgileri', subtitle: 'IBAN bilgileriniz.' },
      work: { title: 'İş Bilgileri', subtitle: 'Pozisyon, yevmiye ve şantiye bilgileriniz.' },
      contracts: { title: 'Sözleşmeler', subtitle: 'Onayladığınız sözleşme kayıtları.' },
      security: { title: 'Güvenlik', subtitle: 'PIN ve hesap güvenliği.' },
      app: { title: 'Uygulama Ayarları', subtitle: 'Görünüm ve kullanım tercihleri.' },
    }),
    []
  );

  const menuItems: Array<{
    id: Exclude<SettingsSectionId, 'home'>;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'personal',
      title: 'Kişisel ayarlar',
      subtitle: 'Ad, soyad, T.C. kimlik, doğum tarihi',
      icon: <FiUser className="w-4 h-4" />,
    },
    {
      id: 'contact',
      title: 'İletişim',
      subtitle: 'E-posta ve telefon numarası',
      icon: <FiPhone className="w-4 h-4" />,
    },
    {
      id: 'bank',
      title: 'Banka',
      subtitle: 'IBAN bilgisi',
      icon: <FiCreditCard className="w-4 h-4" />,
    },
    {
      id: 'work',
      title: 'İş bilgileri',
      subtitle: 'Pozisyon, yevmiye ve proje',
      icon: <FiBriefcase className="w-4 h-4" />,
    },
    {
      id: 'contracts',
      title: 'Sözleşmeler',
      subtitle: 'Onayladığınız sözleşmeler',
      icon: <FiShield className="w-4 h-4" />,
    },
    {
      id: 'security',
      title: 'Güvenlik',
      subtitle: 'PIN kodu ve hesap güvenliği',
      icon: <FiLock className="w-4 h-4" />,
    },
    {
      id: 'app',
      title: 'Uygulama ayarları',
      subtitle: 'Tema ve görünüm tercihleri',
      icon: <FiSettings className="w-4 h-4" />,
    },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'personal':
        return (
          <SettingsGroup title="Kişisel bilgiler" icon={<FiUser className="w-4 h-4" />}>
            <InfoRow label="Ad" value={firstName} />
            <InfoRow label="Soyad" value={lastName} />
            <InfoRow label="T.C. kimlik no" value={employee.tc_kimlik || '—'} mono />
            <InfoRow
              label="Doğum tarihi"
              value={employee.birth_date ? formatDate(employee.birth_date) : '—'}
            />
          </SettingsGroup>
        );
      case 'contact':
        return (
          <SettingsGroup title="İletişim" icon={<FiMail className="w-4 h-4" />}>
            <InfoRow label="E-posta" value={employee.email || '—'} />
            <InfoRow
              label="Telefon"
              value={formatPhoneDisplay(employee.phone)}
              icon={<FiPhone className="w-3.5 h-3.5 text-slate-400" />}
            />
          </SettingsGroup>
        );
      case 'bank':
        return (
          <SettingsGroup title="Banka" icon={<FiCreditCard className="w-4 h-4" />}>
            <InfoRow label="IBAN" value={formatIbanDisplay(employee.iban)} mono />
          </SettingsGroup>
        );
      case 'work':
        return (
          <div className="space-y-4">
            <SettingsGroup title="İş bilgileri" icon={<FiBriefcase className="w-4 h-4" />}>
              <InfoRow label="Pozisyon" value={employee.position || '—'} />
              <InfoRow label="Günlük yevmiye" value={formatMoney(Number(employee.daily_wage))} />
              <InfoRow
                label="İşe giriş"
                value={employee.hire_date ? formatDate(employee.hire_date) : '—'}
              />
            </SettingsGroup>
            {employee.project && <PersonnelProjectCard project={employee.project} />}
          </div>
        );
      case 'contracts':
        return <PersonnelContractsSection />;
      case 'security':
        return (
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => setPasswordOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/80 active:bg-slate-100 transition-colors"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                <FiLock className="w-4 h-4" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 dark:text-white">PIN kodu</p>
                <p className="text-xs text-slate-500 mt-0.5">Giriş şifrenizi güncelleyin</p>
              </div>
              <FiChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
            </button>
          </div>
        );
      case 'app':
        return <PersonnelDisplaySettings />;
      default:
        return (
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
            {menuItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left border-b border-slate-100 dark:border-slate-700/80 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  {item.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                    {item.title}
                  </span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400 truncate">
                    {item.subtitle}
                  </span>
                </span>
                <FiChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white shadow-lg shadow-blue-600/20">
        <div
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 50%)' }}
        />
        <div className="relative px-5 py-6 flex items-center gap-4">
          <button
            type="button"
            disabled={photoBusy}
            onClick={() => cameraInputRef.current?.click()}
            className="group shrink-0 text-left"
            title="Profil fotoğrafını güncelle"
          >
            <span className="relative block">
              <EmployeeAvatar
                name={employee.name}
                photoUrl={photoUrl}
                size="xl"
                className="!rounded-2xl ring-2 ring-white/30 shadow-lg"
              />
              <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-white text-blue-700 shadow-md">
                <FiCamera className="w-3.5 h-3.5" />
              </span>
            </span>
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold truncate">{employee.name}</h2>
            <p className="text-blue-100 text-sm mt-0.5 truncate">{sectionMeta[activeSection].title}</p>
            <p className="text-blue-100/80 text-xs mt-1 leading-relaxed">
              {sectionMeta[activeSection].subtitle}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <button
                type="button"
                disabled={photoBusy}
                onClick={() => cameraInputRef.current?.click()}
                className="inline-flex items-center gap-1 rounded-full bg-white/15 hover:bg-white/20 px-3 py-1.5 transition-colors disabled:opacity-60"
              >
                <FiCamera className="w-3.5 h-3.5" />
                {photoBusy ? 'Yükleniyor…' : 'Fotoğraf çek'}
              </button>
              <button
                type="button"
                disabled={photoBusy}
                onClick={() => galleryInputRef.current?.click()}
                className="inline-flex items-center gap-1 rounded-full bg-white/15 hover:bg-white/20 px-3 py-1.5 transition-colors disabled:opacity-60"
              >
                <FiImage className="w-3.5 h-3.5" />
                Galeriden yükle
              </button>
            </div>
          </div>
        </div>
      </div>
      {photoError && (
        <p className="text-xs text-red-600 -mt-2">{photoError}</p>
      )}

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="sr-only"
        onChange={(e) => void uploadPhoto(e.target.files?.[0] ?? null)}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={(e) => void uploadPhoto(e.target.files?.[0] ?? null)}
      />

      {activeSection !== 'home' && (
        <button
          type="button"
          onClick={() => setActiveSection('home')}
          className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 dark:text-blue-400 hover:underline"
        >
          <FiChevronLeft className="w-4 h-4" />
          Ayarlar listesine dön
        </button>
      )}

      {renderSection()}

      {activeSection === 'home' && (
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
        >
          <FiLogOut className="w-4 h-4" />
          Çıkış yap
        </button>
      )}

      <PersonnelPasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </div>
  );
}

function SettingsGroup({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/50">
        <span className="text-blue-600 dark:text-blue-400">{icon}</span>
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
          {title}
        </p>
      </div>
      <dl className="divide-y divide-slate-100 dark:divide-slate-700/80">{children}</dl>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
  icon,
}: {
  label: string;
  value: string;
  mono?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3.5">
      <dt className="text-sm text-slate-500 shrink-0">{label}</dt>
      <dd
        className={`text-sm font-medium text-slate-900 dark:text-white text-right break-all flex items-center gap-1.5 justify-end ${
          mono ? 'font-mono text-[13px]' : ''
        }`}
      >
        {icon}
        {value}
      </dd>
    </div>
  );
}
