'use client';

import { useMemo, useRef, useState } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
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
import { PersonnelActiveDevices } from '@/components/personnel/PersonnelActiveDevices';
import { PersonnelPasswordModal } from '@/components/personnel/PersonnelPasswordModal';
import { PersonnelProjectCard } from '@/components/personnel/PersonnelProjectCard';
import { formatDate, formatMoney } from '@/lib/format';
import { formatTurkishPhoneNational } from '@/lib/field-encryption';
import type { PersonnelEmployee } from '@/lib/personnel-api';
import { getRegistryStrings } from '@/lib/i18n/strings-registry';

type SettingsStrings = ReturnType<typeof getRegistryStrings<'components/personnel/PersonnelSettingsPage'>>;

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

function formatIbanDisplay(iban: string | null | undefined, strings: SettingsStrings) {
  if (!iban) return strings.emptyValue;
  const clean = iban.replace(/\s/g, '').toUpperCase();
  return clean.replace(/(.{4})/g, '$1 ').trim();
}

function formatPhoneDisplay(phone: string | null | undefined, strings: SettingsStrings) {
  if (!phone) return strings.emptyValue;
  const digits = phone.replace(/\D/g, '');
  const national = digits.startsWith('90') ? digits.slice(2) : digits;
  if (national.length === 10) return formatTurkishPhoneNational(national);
  return phone;
}

export function PersonnelSettingsPage({ employee, onLogout }: Props) {
  const strings = useRegistryStrings('components/personnel/PersonnelSettingsPage');
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<SettingsSectionId>('home');
  const [photoUrl, setPhotoUrl] = useState(employee.photo_url ?? null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const firstName = employee.first_name || employee.name.split(' ')[0] || strings.emptyValue;
  const lastName = employee.last_name || employee.name.split(' ').slice(1).join(' ') || strings.emptyValue;

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
      if (!res.ok) throw new Error(data.error || strings.photoUploadFailed);
      setPhotoUrl(data.photoUrl ?? null);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : strings.photoUploadFailed);
    } finally {
      setPhotoBusy(false);
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  const sectionMeta = useMemo(() => strings.sections, []);

  const menuItems: Array<{
    id: Exclude<SettingsSectionId, 'home'>;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'personal',
      title: strings.menu.personal.title,
      subtitle: strings.menu.personal.subtitle,
      icon: <FiUser className="w-4 h-4" />,
    },
    {
      id: 'contact',
      title: strings.menu.contact.title,
      subtitle: strings.menu.contact.subtitle,
      icon: <FiPhone className="w-4 h-4" />,
    },
    {
      id: 'bank',
      title: strings.menu.bank.title,
      subtitle: strings.menu.bank.subtitle,
      icon: <FiCreditCard className="w-4 h-4" />,
    },
    {
      id: 'work',
      title: strings.menu.work.title,
      subtitle: strings.menu.work.subtitle,
      icon: <FiBriefcase className="w-4 h-4" />,
    },
    {
      id: 'contracts',
      title: strings.menu.contracts.title,
      subtitle: strings.menu.contracts.subtitle,
      icon: <FiShield className="w-4 h-4" />,
    },
    {
      id: 'security',
      title: strings.menu.security.title,
      subtitle: strings.menu.security.subtitle,
      icon: <FiLock className="w-4 h-4" />,
    },
    {
      id: 'app',
      title: strings.menu.app.title,
      subtitle: strings.menu.app.subtitle,
      icon: <FiSettings className="w-4 h-4" />,
    },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'personal':
        return (
          <SettingsGroup title={strings.groups.personalInfo} icon={<FiUser className="w-4 h-4" />}>
            <ProfilePhotoBlock
              name={employee.name}
              photoUrl={photoUrl}
              photoBusy={photoBusy}
              photoError={photoError}
              strings={strings}
              onCamera={() => cameraInputRef.current?.click()}
              onGallery={() => galleryInputRef.current?.click()}
            />
            <InfoRow label={strings.fields.firstName} value={firstName} />
            <InfoRow label={strings.fields.lastName} value={lastName} />
            <InfoRow label={strings.fields.tcKimlik} value={employee.tc_kimlik || strings.emptyValue} mono />
            <InfoRow
              label={strings.fields.birthDate}
              value={employee.birth_date ? formatDate(employee.birth_date) : strings.emptyValue}
            />
          </SettingsGroup>
        );
      case 'contact':
        return (
          <SettingsGroup title={strings.groups.contact} icon={<FiMail className="w-4 h-4" />}>
            <InfoRow label={strings.fields.email} value={employee.email || strings.emptyValue} />
            <InfoRow
              label={strings.fields.phone}
              value={formatPhoneDisplay(employee.phone, strings)}
              icon={<FiPhone className="w-3.5 h-3.5 text-slate-400" />}
            />
          </SettingsGroup>
        );
      case 'bank':
        return (
          <SettingsGroup title={strings.groups.bank} icon={<FiCreditCard className="w-4 h-4" />}>
            <InfoRow label={strings.fields.iban} value={formatIbanDisplay(employee.iban, strings)} mono />
          </SettingsGroup>
        );
      case 'work':
        return (
          <div className="space-y-4">
            <SettingsGroup title={strings.groups.workInfo} icon={<FiBriefcase className="w-4 h-4" />}>
              <InfoRow label={strings.fields.position} value={employee.position || strings.emptyValue} />
              <InfoRow label={strings.fields.dailyWage} value={formatMoney(Number(employee.daily_wage))} />
              <InfoRow
                label={strings.fields.hireDate}
                value={employee.hire_date ? formatDate(employee.hire_date) : strings.emptyValue}
              />
            </SettingsGroup>
            {employee.project && <PersonnelProjectCard project={employee.project} />}
          </div>
        );
      case 'contracts':
        return <PersonnelContractsSection />;
      case 'security':
        return (
          <div className="space-y-4">
            <PersonnelActiveDevices onCurrentDeviceRemoved={onLogout} />
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
                  <p className="font-medium text-slate-900 dark:text-white">{strings.pinTitle}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{strings.pinSubtitle}</p>
                </div>
                <FiChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
              </button>
            </div>
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
      <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          {sectionMeta[activeSection].title}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {sectionMeta[activeSection].subtitle}
        </p>
      </div>

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
          {strings.backToList}
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
          {strings.logout}
        </button>
      )}

      <PersonnelPasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </div>
  );
}

function ProfilePhotoBlock({
  name,
  photoUrl,
  photoBusy,
  photoError,
  strings,
  onCamera,
  onGallery,
}: {
  name: string;
  photoUrl: string | null;
  photoBusy: boolean;
  photoError: string | null;
  strings: SettingsStrings;
  onCamera: () => void;
  onGallery: () => void;
}) {
  return (
    <div className="border-b border-slate-100 bg-gradient-to-b from-slate-50/90 to-white px-4 py-5 dark:border-slate-700/80 dark:from-slate-800/50 dark:to-slate-800">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {strings.profilePhoto}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-slate-400 dark:text-slate-500">
        {strings.profilePhotoHint}
      </p>

      <div className="mt-4 flex flex-col items-center">
        <button
          type="button"
          disabled={photoBusy}
          onClick={onCamera}
          className="group relative shrink-0"
          title={strings.updatePhotoTitle}
        >
          <EmployeeAvatar
            name={name}
            photoUrl={photoUrl}
            size="xl"
            className="!h-[5.5rem] !w-[5.5rem] !rounded-2xl ring-2 ring-slate-200 shadow-md transition group-hover:ring-blue-300 dark:ring-slate-600"
          />
          <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#0E1548] text-white shadow-lg ring-2 ring-white dark:ring-slate-800">
            <FiCamera className="h-4 w-4" />
          </span>
        </button>

        <div className="mt-4 grid w-full grid-cols-2 gap-2">
          <button
            type="button"
            disabled={photoBusy}
            onClick={onCamera}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0E1548] px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#152060] disabled:opacity-60"
          >
            <FiCamera className="h-4 w-4 shrink-0" />
            <span className="truncate">{photoBusy ? strings.uploading : strings.takePhoto}</span>
          </button>
          <button
            type="button"
            disabled={photoBusy}
            onClick={onGallery}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <FiImage className="h-4 w-4 shrink-0" />
            <span className="truncate">{strings.uploadFromGallery}</span>
          </button>
        </div>

        {photoError ? (
          <p className="mt-3 w-full rounded-lg bg-red-50 px-3 py-2 text-center text-xs text-red-600 dark:bg-red-950/40 dark:text-red-300">
            {photoError}
          </p>
        ) : null}
      </div>
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
