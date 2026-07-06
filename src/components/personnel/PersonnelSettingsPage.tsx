'use client';

import { useRef, useState } from 'react';
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

type MenuItemId = Exclude<SettingsSectionId, 'home'>;

const MENU_ICON_STYLES: Record<MenuItemId, string> = {
  personal: 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300',
  contact: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300',
  bank: 'bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300',
  work: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  contracts: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300',
  security: 'bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300',
  app: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-200',
};

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

function maskPhoneForProfile(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  const national = digits.startsWith('90') ? digits.slice(2) : digits;
  if (national.length !== 10) return null;
  return `+90 ${national.slice(0, 3)}*****${national.slice(8)}`;
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
  const profileSubtitle =
    employee.position?.trim() ||
    maskPhoneForProfile(employee.phone) ||
    strings.profileAccountLabel;

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

  const menuItems: Array<{
    id: MenuItemId;
    title: string;
    icon: React.ReactNode;
  }> = [
    { id: 'personal', title: strings.menu.personal.title, icon: <FiUser className="h-[1.05rem] w-[1.05rem]" /> },
    { id: 'contact', title: strings.menu.contact.title, icon: <FiPhone className="h-[1.05rem] w-[1.05rem]" /> },
    { id: 'bank', title: strings.menu.bank.title, icon: <FiCreditCard className="h-[1.05rem] w-[1.05rem]" /> },
    { id: 'work', title: strings.menu.work.title, icon: <FiBriefcase className="h-[1.05rem] w-[1.05rem]" /> },
    { id: 'contracts', title: strings.menu.contracts.title, icon: <FiShield className="h-[1.05rem] w-[1.05rem]" /> },
    { id: 'security', title: strings.menu.security.title, icon: <FiLock className="h-[1.05rem] w-[1.05rem]" /> },
    { id: 'app', title: strings.menu.app.title, icon: <FiSettings className="h-[1.05rem] w-[1.05rem]" /> },
  ];

  const accountItems = menuItems.filter((item) => ['personal', 'contact', 'bank'].includes(item.id));
  const workItems = menuItems.filter((item) => ['work', 'contracts'].includes(item.id));
  const systemItems = menuItems.filter((item) => ['security', 'app'].includes(item.id));

  const renderSection = () => {
    switch (activeSection) {
      case 'personal':
        return (
          <SettingsCard>
            <ProfilePhotoBlock
              name={employee.name}
              photoUrl={photoUrl}
              photoBusy={photoBusy}
              photoError={photoError}
              strings={strings}
              onCamera={() => cameraInputRef.current?.click()}
              onGallery={() => galleryInputRef.current?.click()}
            />
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              <InfoRow label={strings.fields.firstName} value={firstName} />
              <InfoRow label={strings.fields.lastName} value={lastName} />
              <InfoRow label={strings.fields.tcKimlik} value={employee.tc_kimlik || strings.emptyValue} mono />
              <InfoRow
                label={strings.fields.birthDate}
                value={employee.birth_date ? formatDate(employee.birth_date) : strings.emptyValue}
              />
            </div>
          </SettingsCard>
        );
      case 'contact':
        return (
          <SettingsCard>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              <InfoRow label={strings.fields.email} value={employee.email || strings.emptyValue} />
              <InfoRow
                label={strings.fields.phone}
                value={formatPhoneDisplay(employee.phone, strings)}
                icon={<FiPhone className="w-3.5 h-3.5 text-slate-400" />}
              />
            </div>
          </SettingsCard>
        );
      case 'bank':
        return (
          <SettingsCard>
            <InfoRow label={strings.fields.iban} value={formatIbanDisplay(employee.iban, strings)} mono />
          </SettingsCard>
        );
      case 'work':
        return (
          <div className="space-y-3">
            <SettingsCard>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                <InfoRow label={strings.fields.position} value={employee.position || strings.emptyValue} />
                <InfoRow label={strings.fields.dailyWage} value={formatMoney(Number(employee.daily_wage))} />
                <InfoRow
                  label={strings.fields.hireDate}
                  value={employee.hire_date ? formatDate(employee.hire_date) : strings.emptyValue}
                />
              </div>
            </SettingsCard>
            {employee.project && <PersonnelProjectCard project={employee.project} />}
          </div>
        );
      case 'contracts':
        return <PersonnelContractsSection />;
      case 'security':
        return (
          <div className="space-y-3">
            <PersonnelActiveDevices onCurrentDeviceRemoved={onLogout} />
            <SettingsCard>
              <MenuRow
                title={strings.pinTitle}
                icon={<FiLock className="h-[1.05rem] w-[1.05rem]" />}
                iconClassName={MENU_ICON_STYLES.security}
                onClick={() => setPasswordOpen(true)}
              />
            </SettingsCard>
          </div>
        );
      case 'app':
        return <PersonnelDisplaySettings />;
      default:
        return (
          <div className="space-y-3">
            <SettingsCard>
              <button
                type="button"
                onClick={() => setActiveSection('personal')}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50 active:bg-slate-100 dark:hover:bg-slate-800/60"
              >
                <EmployeeAvatar
                  name={employee.name}
                  photoUrl={photoUrl}
                  size="md"
                  className="!h-12 !w-12 shrink-0 !rounded-full ring-1 ring-slate-200 dark:ring-slate-600"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-semibold text-slate-900 dark:text-white">
                    {employee.name}
                  </span>
                  <span className="mt-0.5 block truncate text-sm text-slate-500 dark:text-slate-400">
                    {profileSubtitle}
                  </span>
                </span>
                <FiChevronRight className="h-5 w-5 shrink-0 text-slate-300 dark:text-slate-500" />
              </button>
            </SettingsCard>

            <SettingsCard>
              {accountItems.map((item, index) => (
                <MenuRow
                  key={item.id}
                  title={item.title}
                  icon={item.icon}
                  iconClassName={MENU_ICON_STYLES[item.id]}
                  onClick={() => setActiveSection(item.id)}
                  showDivider={index < accountItems.length - 1}
                />
              ))}
            </SettingsCard>

            <SettingsCard>
              {workItems.map((item, index) => (
                <MenuRow
                  key={item.id}
                  title={item.title}
                  icon={item.icon}
                  iconClassName={MENU_ICON_STYLES[item.id]}
                  onClick={() => setActiveSection(item.id)}
                  showDivider={index < workItems.length - 1}
                />
              ))}
            </SettingsCard>

            <SettingsCard>
              {systemItems.map((item, index) => (
                <MenuRow
                  key={item.id}
                  title={item.title}
                  icon={item.icon}
                  iconClassName={MENU_ICON_STYLES[item.id]}
                  onClick={() => setActiveSection(item.id)}
                  showDivider={index < systemItems.length - 1}
                />
              ))}
            </SettingsCard>

            <button
              type="button"
              onClick={onLogout}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-sm font-medium text-slate-500 shadow-sm transition hover:bg-red-50 hover:text-red-600 dark:bg-slate-800 dark:hover:bg-red-950/30"
            >
              <FiLogOut className="h-4 w-4" />
              {strings.logout}
            </button>
          </div>
        );
    }
  };

  const pageTitle = strings.sections[activeSection].title;

  return (
    <div className="-mx-3 sm:-mx-6 -mt-3 min-h-full bg-[#f0f2f5] px-3 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:bg-slate-950 sm:min-h-[60vh] sm:px-4 sm:py-5">
      <div className="mx-auto max-w-lg space-y-4">
        {activeSection !== 'home' ? (
          <button
            type="button"
            onClick={() => setActiveSection('home')}
            className="inline-flex items-center gap-1 text-sm font-medium text-[#0E1548] dark:text-blue-300"
          >
            <FiChevronLeft className="h-5 w-5" />
            {strings.backToList}
          </button>
        ) : null}

        <div>
          <h1 className="text-[1.75rem] font-bold leading-tight tracking-tight text-slate-900 dark:text-white">
            {pageTitle}
          </h1>
          {activeSection !== 'home' ? (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {strings.sections[activeSection].subtitle}
            </p>
          ) : null}
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

        {renderSection()}
      </div>

      <PersonnelPasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </div>
  );
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.04] dark:bg-slate-900 dark:ring-white/10">
      {children}
    </div>
  );
}

function MenuRow({
  title,
  icon,
  iconClassName,
  onClick,
  showDivider = true,
}: {
  title: string;
  icon: React.ReactNode;
  iconClassName: string;
  onClick: () => void;
  showDivider?: boolean;
}) {
  return (
    <>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50 active:bg-slate-100 dark:hover:bg-slate-800/60"
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.65rem] ${iconClassName}`}
        >
          {icon}
        </span>
        <span className="min-w-0 flex-1 text-[15px] font-medium text-slate-900 dark:text-white">{title}</span>
        <FiChevronRight className="h-5 w-5 shrink-0 text-slate-300 dark:text-slate-500" />
      </button>
      {showDivider ? <div className="ml-[3.25rem] h-px bg-slate-100 dark:bg-slate-800" /> : null}
    </>
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
    <div className="border-b border-slate-100 px-4 py-5 dark:border-slate-800">
      <p className="text-sm font-semibold text-slate-900 dark:text-white">{strings.profilePhoto}</p>
      <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
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
            className="!h-[5.5rem] !w-[5.5rem] !rounded-full ring-2 ring-slate-200 shadow-sm transition group-hover:ring-blue-300 dark:ring-slate-600"
          />
          <span className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-[#0E1548] text-white shadow-md ring-2 ring-white dark:ring-slate-900">
            <FiCamera className="h-4 w-4" />
          </span>
        </button>

        <div className="mt-4 grid w-full grid-cols-2 gap-2">
          <button
            type="button"
            disabled={photoBusy}
            onClick={onCamera}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0E1548] px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-[#152060] disabled:opacity-60"
          >
            <FiCamera className="h-4 w-4 shrink-0" />
            <span className="truncate">{photoBusy ? strings.uploading : strings.takePhoto}</span>
          </button>
          <button
            type="button"
            disabled={photoBusy}
            onClick={onGallery}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-white disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          >
            <FiImage className="h-4 w-4 shrink-0" />
            <span className="truncate">{strings.uploadFromGallery}</span>
          </button>
        </div>

        {photoError ? (
          <p className="mt-3 w-full rounded-xl bg-red-50 px-3 py-2 text-center text-xs text-red-600 dark:bg-red-950/40 dark:text-red-300">
            {photoError}
          </p>
        ) : null}
      </div>
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
      <span className="shrink-0 text-sm text-slate-500 dark:text-slate-400">{label}</span>
      <span
        className={`flex items-center justify-end gap-1.5 break-all text-right text-sm font-medium text-slate-900 dark:text-white ${
          mono ? 'font-mono text-[13px]' : ''
        }`}
      >
        {icon}
        {value}
      </span>
    </div>
  );
}
