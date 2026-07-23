'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import {
  FiCamera,
  FiChevronLeft,
  FiChevronRight,
  FiCreditCard,
  FiImage,
  FiLogOut,
  FiPhone,
  FiTrash2,
  FiX,
} from 'react-icons/fi';
import { HonorIconTile, type HonorIconName, type HonorIconTheme } from '@/components/icons/HonorIcons';
import { EmployeeAvatar } from '@/components/employee/EmployeeAvatar';
import { PersonnelAssetIcon, type PersonnelIconName } from '@/components/personnel/PersonnelAssetIcon';
import { PersonnelContractsSection } from '@/components/personnel/PersonnelContractsSection';
import { PersonnelClosureDossierPanel } from '@/components/personnel/PersonnelClosureDossierPanel';
import { PersonnelAppSettings, type AppSettingsView } from '@/components/personnel/PersonnelAppSettings';
import { PersonnelReleaseNotesPanel } from '@/components/personnel/PersonnelReleaseNotesPanel';
import { PersonnelActiveDevices } from '@/components/personnel/PersonnelActiveDevices';
import { PersonnelPasswordModal } from '@/components/personnel/PersonnelPasswordModal';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { formatDate, formatMoney } from '@/lib/format';
import { formatTurkishPhoneNational } from '@/lib/field-encryption';
import { bankDisplayFromIban, type TurkishBankDisplay } from '@/lib/turkish-banks';
import type { PersonnelEmployee } from '@/lib/personnel-api';
import { getRegistryStrings } from '@/lib/i18n/strings-registry';

type SettingsStrings = ReturnType<typeof getRegistryStrings<'components/personnel/PersonnelSettingsPage'>>;

type Props = {
  employee: PersonnelEmployee;
  onLogout: () => void;
};

type SettingsSectionId =
  | 'home'
  | 'profile'
  | 'work'
  | 'contracts'
  | 'security'
  | 'app'
  | 'releases';

type MenuItemId = Exclude<SettingsSectionId, 'home' | 'profile'>;

const MENU_ICON_DEFS: Record<
  MenuItemId,
  { name: HonorIconName; theme: HonorIconTheme } | { asset: PersonnelIconName }
> = {
  work: { asset: 'briefcase' },
  contracts: { asset: 'rights' },
  security: { asset: 'asgari' },
  app: { asset: 'appSettings' },
  releases: { asset: 'updated' },
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
  const appSettingsStrings = useRegistryStrings('components/personnel/PersonnelAppSettings');
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<SettingsSectionId>('home');
  const [appSettingsView, setAppSettingsView] = useState<AppSettingsView>('menu');
  const [photoUrl, setPhotoUrl] = useState(employee.photo_url ?? null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useBodyScrollLock(logoutConfirmOpen);

  useEffect(() => {
    if (activeSection !== 'app') setAppSettingsView('menu');
  }, [activeSection]);

  useEffect(() => {
    if (!logoutConfirmOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLogoutConfirmOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [logoutConfirmOpen]);

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

  const removePhoto = async () => {
    setPhotoError(null);
    setPhotoBusy(true);
    try {
      const res = await fetch('/api/personnel/me/photo', {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || strings.photoRemoveFailed);
      }
      setPhotoUrl(null);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : strings.photoRemoveFailed);
    } finally {
      setPhotoBusy(false);
    }
  };

  const menuItems: Array<{
    id: MenuItemId;
    title: string;
  }> = [
    { id: 'work', title: strings.menu.work.title },
    { id: 'contracts', title: strings.menu.contracts.title },
    { id: 'security', title: strings.menu.security.title },
    { id: 'releases', title: strings.menu.releases.title },
    { id: 'app', title: strings.menu.app.title },
  ];

  const workItems = menuItems.filter((item) => ['work', 'contracts'].includes(item.id));
  const systemItems = menuItems.filter((item) =>
    ['security', 'releases', 'app'].includes(item.id)
  );

  const pageTitle =
    activeSection === 'profile'
      ? employee.name
      : activeSection === 'app' && appSettingsView !== 'menu'
        ? appSettingsStrings.sections[appSettingsView]
        : strings.sections[activeSection].title;

  const pageSubtitle =
    activeSection === 'profile'
      ? strings.sections.profile.subtitle
      : activeSection === 'app' && appSettingsView !== 'menu'
        ? null
        : activeSection !== 'home'
          ? strings.sections[activeSection].subtitle
          : null;

  const handleBack = () => {
    if (activeSection === 'app' && appSettingsView !== 'menu') {
      setAppSettingsView('menu');
      return;
    }
    setActiveSection('home');
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="space-y-3">
            <SettingsCard>
              <ProfilePhotoBlock
                name={employee.name}
                photoUrl={photoUrl}
                photoBusy={photoBusy}
                photoError={photoError}
                strings={strings}
                onCamera={() => cameraInputRef.current?.click()}
                onGallery={() => galleryInputRef.current?.click()}
                onRemove={() => void removePhoto()}
              />
              <GroupLabel>{strings.groups.personalInfo}</GroupLabel>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                <InfoRow label={strings.fields.firstName} value={firstName} />
                <InfoRow label={strings.fields.lastName} value={lastName} />
                <InfoRow
                  label={strings.fields.tcKimlik}
                  value={employee.tc_kimlik || strings.emptyValue}
                  mono
                />
                <InfoRow
                  label={strings.fields.birthDate}
                  value={employee.birth_date ? formatDate(employee.birth_date) : strings.emptyValue}
                />
              </div>
            </SettingsCard>

            <SettingsCard>
              <GroupLabel>{strings.groups.contact}</GroupLabel>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                <InfoRow label={strings.fields.email} value={employee.email || strings.emptyValue} />
                <InfoRow
                  label={strings.fields.phone}
                  value={formatPhoneDisplay(employee.phone, strings)}
                  icon={<FiPhone className="w-3.5 h-3.5 text-slate-400" />}
                />
              </div>
            </SettingsCard>

            <SettingsCard>
              <GroupLabel>{strings.groups.bank}</GroupLabel>
              <BankFromIbanRow iban={employee.iban} strings={strings} />
              <div className="border-t border-slate-100 dark:border-slate-800">
                <InfoRow
                  label={strings.fields.iban}
                  value={formatIbanDisplay(employee.iban, strings)}
                  mono
                />
              </div>
            </SettingsCard>
          </div>
        );
      case 'work':
        return (
          <SettingsCard>
            <div className="p-4">
              <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/90 to-white p-4 dark:border-indigo-900/50 dark:from-slate-800 dark:to-slate-900">
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  {strings.fields.project}
                </p>
                <p className="mt-1 text-lg font-bold leading-snug text-slate-900 dark:text-white">
                  {employee.project?.name || employee.project_name || strings.emptyValue}
                </p>
                <div className="mt-2 rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/70">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {strings.fields.site}
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">
                    {employee.project?.location || strings.emptyValue}
                  </p>
                </div>

                <div className="mt-4 divide-y divide-slate-200/80 rounded-xl border border-slate-200/80 bg-white dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-900/80">
                  <InfoRow label={strings.fields.position} value={employee.position || strings.emptyValue} />
                  <InfoRow label={strings.fields.dailyWage} value={formatMoney(Number(employee.daily_wage))} />
                  <InfoRow
                    label={strings.fields.hireDate}
                    value={employee.hire_date ? formatDate(employee.hire_date) : strings.emptyValue}
                  />
                </div>
              </div>
            </div>
          </SettingsCard>
        );
      case 'contracts':
        return (
          <div className="space-y-3">
            <PersonnelContractsSection />
            <SettingsCard>
              <div className="px-4 py-4">
                <PersonnelClosureDossierPanel variant="card" showDailyLimit />
              </div>
            </SettingsCard>
          </div>
        );
      case 'security':
        return (
          <div className="space-y-3">
            <PersonnelActiveDevices onCurrentDeviceRemoved={onLogout} />
            <SettingsCard>
              <MenuRow
                title={strings.pinTitle}
                iconDef={MENU_ICON_DEFS.security}
                onClick={() => setPasswordOpen(true)}
              />
            </SettingsCard>
          </div>
        );
      case 'app':
        return (
          <PersonnelAppSettings
            view={appSettingsView}
            onViewChange={setAppSettingsView}
            onOpenReleases={() => setActiveSection('releases')}
          />
        );
      case 'releases':
        return <PersonnelReleaseNotesPanel />;
      default:
        return (
          <div className="space-y-3">
            <SettingsCard>
              <button
                type="button"
                onClick={() => setActiveSection('profile')}
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
              {workItems.map((item, index) => (
                <MenuRow
                  key={item.id}
                  title={item.title}
                  iconDef={MENU_ICON_DEFS[item.id]}
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
                  iconDef={MENU_ICON_DEFS[item.id]}
                  onClick={() => setActiveSection(item.id)}
                  showDivider={index < systemItems.length - 1}
                />
              ))}
            </SettingsCard>

            <button
              type="button"
              onClick={() => setLogoutConfirmOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 py-3.5 text-sm font-medium text-red-600 shadow-sm transition hover:bg-red-100 active:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
            >
              <FiLogOut className="h-4 w-4" />
              {strings.logout}
            </button>

            <div className="flex w-full flex-col items-center px-1 pt-5 pb-1">
              <Image
                src="/dijital-onay.png"
                alt={strings.digitalApprovalMarkAlt}
                width={720}
                height={240}
                className="h-auto w-full max-w-md object-contain"
                priority={false}
              />
              <p className="mt-2.5 text-center text-[11px] font-medium tracking-wide text-slate-500 dark:text-slate-400">
                {strings.digitalApprovalMark}
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="-mx-3 sm:-mx-6 -mt-3 min-h-full bg-[#f0f2f5] px-3 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:bg-slate-950 sm:min-h-[60vh] sm:px-4 sm:py-5">
      <div className="mx-auto max-w-lg space-y-4">
        {activeSection !== 'home' ? (
          <button
            type="button"
            onClick={handleBack}
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
          {pageSubtitle ? (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{pageSubtitle}</p>
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

      {logoutConfirmOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/55 backdrop-blur-md"
            onClick={() => setLogoutConfirmOpen(false)}
            aria-label={strings.logoutCancel}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-confirm-title"
            className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl shadow-slate-900/25 dark:bg-slate-900"
          >
            <div className="px-5 pt-5 pb-4 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300">
                <FiLogOut className="h-5 w-5" />
              </span>
              <h2
                id="logout-confirm-title"
                className="mt-3 text-base font-semibold text-slate-900 dark:text-white"
              >
                {strings.logout}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {strings.logoutConfirm}
              </p>
            </div>
            <div className="flex gap-2 border-t border-slate-100 px-4 py-3 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setLogoutConfirmOpen(false)}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                {strings.logoutCancel}
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                {strings.logoutConfirmButton}
              </button>
            </div>
          </div>
        </div>
      ) : null}
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

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="border-b border-slate-100 px-4 pb-2 pt-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:text-slate-400">
      {children}
    </p>
  );
}

function BankLogoMark({ bank }: { bank: TurkishBankDisplay }) {
  const [logoFailed, setLogoFailed] = useState(false);
  const showLogo = Boolean(bank.logoSrc) && !logoFailed;

  if (showLogo && bank.logoSrc) {
    return (
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5 dark:bg-slate-800 dark:ring-white/10">
        <Image
          src={bank.logoSrc}
          alt=""
          width={40}
          height={40}
          className="h-full w-full object-contain p-1.5"
          draggable={false}
          unoptimized
          onError={() => setLogoFailed(true)}
        />
      </span>
    );
  }

  return (
    <span
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold tracking-tight shadow-sm ring-1 ring-black/5 dark:ring-white/10"
      style={{ backgroundColor: bank.color, color: bank.textColor }}
      aria-hidden
    >
      {bank.initials}
    </span>
  );
}

function BankFromIbanRow({
  iban,
  strings,
}: {
  iban: string | null | undefined;
  strings: SettingsStrings;
}) {
  const bank = bankDisplayFromIban(iban);
  const name = bank?.name ?? (iban ? strings.fields.unknownBank : strings.emptyValue);

  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      {bank ? (
        <BankLogoMark bank={bank} />
      ) : (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 ring-1 ring-violet-100 dark:bg-violet-950/40 dark:text-violet-300 dark:ring-violet-900/50">
          <FiCreditCard className="h-5 w-5" aria-hidden />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {strings.fields.bankName}
        </span>
        <span className="mt-0.5 block truncate text-sm font-semibold text-slate-900 dark:text-white">
          {name}
        </span>
      </span>
    </div>
  );
}

function MenuRow({
  title,
  subtitle,
  iconDef,
  onClick,
  showDivider = true,
}: {
  title: string;
  subtitle?: string;
  iconDef: { name: HonorIconName; theme: HonorIconTheme } | { asset: PersonnelIconName };
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
        {'asset' in iconDef ? (
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center">
            <PersonnelAssetIcon name={iconDef.asset} className="h-9 w-9" />
          </span>
        ) : (
          <HonorIconTile name={iconDef.name} theme={iconDef.theme} size="sm" muted />
        )}
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-medium text-slate-900 dark:text-white">{title}</span>
          {subtitle ? (
            <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</span>
          ) : null}
        </span>
        <FiChevronRight className="h-5 w-5 shrink-0 text-slate-300 dark:text-slate-500" />
      </button>
      {showDivider ? <div className="mx-4 h-px bg-slate-100 dark:bg-slate-800" /> : null}
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
  onRemove,
}: {
  name: string;
  photoUrl: string | null;
  photoBusy: boolean;
  photoError: string | null;
  strings: SettingsStrings;
  onCamera: () => void;
  onGallery: () => void;
  onRemove: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const hasPhoto = Boolean(photoUrl);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const openMenu = () => {
    if (photoBusy) return;
    setMenuOpen(true);
  };

  const runAndClose = (action: () => void) => {
    setMenuOpen(false);
    action();
  };

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
          onClick={openMenu}
          className="group relative shrink-0 disabled:opacity-60"
          title={strings.updatePhotoTitle}
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
        >
          <EmployeeAvatar
            name={name}
            photoUrl={photoUrl}
            size="xl"
            className="!h-[5.5rem] !w-[5.5rem] !rounded-full ring-2 ring-slate-200 shadow-sm transition group-hover:ring-blue-300 dark:ring-slate-600"
          />
          <span className="absolute -bottom-0.5 -right-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md ring-2 ring-white dark:ring-slate-900">
            {photoBusy ? (
              <span className="h-3.5 w-3.5 animate-pulse rounded-full bg-slate-300" />
            ) : (
              <PersonnelAssetIcon name="camera" className="h-7 w-7" />
            )}
          </span>
        </button>

        {photoError ? (
          <p className="mt-3 w-full rounded-xl bg-red-50 px-3 py-2 text-center text-xs text-red-600 dark:bg-red-950/40 dark:text-red-300">
            {photoError}
          </p>
        ) : null}
      </div>

      {menuOpen ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
            aria-label={strings.photoMenuCancel}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="photo-menu-title"
            className="safe-pb relative w-full max-w-md overflow-hidden rounded-t-2xl bg-white shadow-2xl dark:bg-slate-900 sm:rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <p
                id="photo-menu-title"
                className="text-sm font-semibold text-slate-900 dark:text-white"
              >
                {strings.photoMenuTitle}
              </p>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label={strings.photoMenuCancel}
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
            <div className="p-2">
              <button
                type="button"
                onClick={() => runAndClose(onCamera)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-left text-sm font-medium text-slate-900 transition hover:bg-slate-50 dark:text-white dark:hover:bg-slate-800"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0E1548]/[0.08] text-[#0E1548] dark:bg-white/10 dark:text-white">
                  <FiCamera className="h-4 w-4" />
                </span>
                {photoBusy ? strings.uploading : strings.takePhoto}
              </button>
              <button
                type="button"
                onClick={() => runAndClose(onGallery)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-left text-sm font-medium text-slate-900 transition hover:bg-slate-50 dark:text-white dark:hover:bg-slate-800"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <FiImage className="h-4 w-4" />
                </span>
                {strings.uploadFromGallery}
              </button>
              {hasPhoto ? (
                <button
                  type="button"
                  onClick={() => runAndClose(onRemove)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
                    <FiTrash2 className="h-4 w-4" />
                  </span>
                  {strings.removePhoto}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
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
