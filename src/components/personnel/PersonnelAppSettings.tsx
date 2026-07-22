'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FiBell,
  FiChevronRight,
  FiInfo,
  FiMoon,
  FiRefreshCw,
  FiSmartphone,
  FiSun,
  FiTrash2,
} from 'react-icons/fi';
import { LanguageSwitch } from '@/components/i18n/LanguageSwitch';
import { HonorIconTile, type HonorIconName, type HonorIconTheme } from '@/components/icons/HonorIcons';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { clearPersonnelClientData } from '@/lib/personnel-data-reset';
import { usePersonnelDisplay } from '@/lib/personnel-display-preferences';
import {
  fetchPushSubscriptionStatus,
  getNotificationPermission,
  registerPersonnelPushIfAuthed,
  requestNotificationPermission,
} from '@/lib/personnel-push-client';
import { isPersonnelTwaRuntime, openPersonnelAppNotificationSettings } from '@/lib/personnel-app-runtime';
import { usePersonnelTheme, type PersonnelThemeMode } from '@/lib/personnel-theme';
import { formatDate } from '@/lib/format';
import { formatApkFileSize } from '@/lib/app-releases';
import { APP_NAME } from '@/lib/brand';

export type AppSettingsView =
  | 'menu'
  | 'appearance'
  | 'language'
  | 'notifications'
  | 'about'
  | 'data';

type PersonnelRelease = {
  appType: string;
  id: string | null;
  versionName?: string;
  versionCode?: number;
  fileSize?: number;
  publishedAt?: string | null;
};

type Props = {
  onOpenReleases?: () => void;
  view?: AppSettingsView;
  onViewChange?: (view: AppSettingsView) => void;
};

const MENU_ITEMS: Array<{
  id: Exclude<AppSettingsView, 'menu'>;
  icon: HonorIconName;
  theme: HonorIconTheme;
}> = [
  { id: 'appearance', icon: 'settings', theme: 'slate' },
  { id: 'language', icon: 'globe', theme: 'teal' },
  { id: 'notifications', icon: 'inbox', theme: 'violet' },
  { id: 'about', icon: 'document', theme: 'sky' },
  { id: 'data', icon: 'shield', theme: 'rose' },
];

export function PersonnelAppSettings({
  onOpenReleases,
  view: viewProp,
  onViewChange,
}: Props) {
  const strings = useRegistryStrings('components/personnel/PersonnelAppSettings');
  const { mode, setMode } = usePersonnelTheme();
  const { largeText, highContrast, setLargeText, setHighContrast } = usePersonnelDisplay();

  const [internalView, setInternalView] = useState<AppSettingsView>('menu');
  const view = viewProp ?? internalView;
  const setView = (next: AppSettingsView) => {
    onViewChange?.(next);
    if (viewProp === undefined) setInternalView(next);
  };

  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [notifyBusy, setNotifyBusy] = useState(false);
  const [isTwa, setIsTwa] = useState(false);

  const [release, setRelease] = useState<PersonnelRelease | null>(null);
  const [releaseLoading, setReleaseLoading] = useState(true);
  const [releaseError, setReleaseError] = useState<string | null>(null);

  const [resetting, setResetting] = useState(false);

  const refreshNotificationState = useCallback(async () => {
    setPermission(getNotificationPermission());
    const status = await fetchPushSubscriptionStatus();
    setSubscribed(status?.currentSessionSubscribed ?? false);
  }, []);

  useEffect(() => {
    setIsTwa(isPersonnelTwaRuntime());
    void refreshNotificationState();
  }, [refreshNotificationState]);

  useEffect(() => {
    if (view !== 'about' && view !== 'menu') return;
    let cancelled = false;
    setReleaseLoading(true);
    setReleaseError(null);
    fetch('/api/public/releases')
      .then(async (res) => {
        const data = (await res.json()) as { releases?: PersonnelRelease[]; error?: string };
        if (!res.ok) throw new Error(data.error || strings.about.loadFailed);
        const personnel = (data.releases ?? []).find((row) => row.appType === 'personnel');
        if (!cancelled) setRelease(personnel ?? null);
      })
      .catch((err) => {
        if (!cancelled) {
          setRelease(null);
          setReleaseError(err instanceof Error ? err.message : strings.about.loadFailed);
        }
      })
      .finally(() => {
        if (!cancelled) setReleaseLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [strings.about.loadFailed, view]);

  const permissionLabel = (() => {
    switch (permission) {
      case 'granted':
        return strings.notifications.granted;
      case 'denied':
        return strings.notifications.denied;
      case 'unsupported':
        return strings.notifications.unsupported;
      default:
        return strings.notifications.default;
    }
  })();

  const permissionHint = (() => {
    switch (permission) {
      case 'granted':
        return strings.notifications.hintGranted;
      case 'denied':
        return strings.notifications.hintDenied;
      default:
        return strings.notifications.hintDefault;
    }
  })();

  const handleEnableNotifications = async () => {
    setNotifyBusy(true);
    try {
      if (isTwa && permission === 'denied') {
        openPersonnelAppNotificationSettings();
        await requestNotificationPermission({ twaAfterSettings: true });
      } else {
        await requestNotificationPermission();
      }
      await registerPersonnelPushIfAuthed({ force: true, allowPrompt: true, twaBypassPermission: isTwa });
      await refreshNotificationState();
    } finally {
      setNotifyBusy(false);
    }
  };

  const handleResetData = async () => {
    if (resetting) return;
    if (typeof window !== 'undefined' && !window.confirm(strings.data.confirm)) return;
    setResetting(true);
    try {
      await fetch('/api/auth/personnel/logout', { method: 'POST' }).catch(() => {});
      await clearPersonnelClientData();
    } finally {
      window.location.replace('/personnel-panel/basla');
    }
  };

  const versionLabel = release?.versionName
    ? release.versionCode
      ? `v${release.versionName} (${release.versionCode})`
      : `v${release.versionName}`
    : strings.about.unknownVersion;

  const menuHints: Record<Exclude<AppSettingsView, 'menu'>, string> = {
    appearance: strings.menuHints.appearance,
    language: strings.menuHints.language,
    notifications: strings.menuHints.notifications,
    about: strings.menuHints.about,
    data: strings.menuHints.data,
  };

  if (view === 'menu') {
    return (
      <div className="space-y-3">
        <p className="px-1 text-center text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          {strings.pageSubtitle}
        </p>
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.04] dark:bg-slate-900 dark:ring-white/10">
          {MENU_ITEMS.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setView(item.id)}
              className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50 active:bg-slate-100 dark:hover:bg-slate-800/80 dark:active:bg-slate-800 ${
                index < MENU_ITEMS.length - 1 ? 'border-b border-slate-100 dark:border-slate-800' : ''
              }`}
            >
              <HonorIconTile name={item.icon} theme={item.theme} size="sm" muted />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium text-slate-900 dark:text-white">
                  {strings.sections[item.id]}
                </span>
                <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">
                  {menuHints[item.id]}
                </span>
              </span>
              <FiChevronRight className="h-5 w-5 shrink-0 text-slate-300 dark:text-slate-500" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (view === 'appearance') {
    return (
      <SettingsCard>
        <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <p className="text-sm font-medium text-slate-900 dark:text-white">{strings.theme.label}</p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{strings.theme.hint}</p>
          <ThemeSegment mode={mode} onChange={setMode} strings={strings.theme} />
        </div>
        <ToggleRow
          label={strings.largeTextLabel}
          hint={strings.largeTextHint}
          checked={largeText}
          onChange={setLargeText}
        />
        <ToggleRow
          label={strings.highContrastLabel}
          hint={strings.highContrastHint}
          checked={highContrast}
          onChange={setHighContrast}
          showDivider={false}
        />
      </SettingsCard>
    );
  }

  if (view === 'language') {
    return (
      <SettingsCard>
        <div className="px-4 py-3.5">
          <div className="mb-3">
            <p className="text-sm font-medium text-slate-900 dark:text-white">{strings.languageLabel}</p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{strings.languageHint}</p>
          </div>
          <LanguageSwitch variant="list" />
        </div>
      </SettingsCard>
    );
  }

  if (view === 'notifications') {
    return (
      <SettingsCard>
        <InfoRow label={strings.notifications.statusLabel} value={permissionLabel} />
        {permission !== 'unsupported' && subscribed !== null ? (
          <InfoRow
            label={strings.notifications.subscriptionLabel}
            value={subscribed ? strings.notifications.subscribed : strings.notifications.notSubscribed}
          />
        ) : null}
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{permissionHint}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {permission !== 'granted' && permission !== 'unsupported' ? (
              <ActionChip
                onClick={() => void handleEnableNotifications()}
                disabled={notifyBusy}
                primary
              >
                <FiBell className="h-3.5 w-3.5" />
                {notifyBusy ? strings.notifications.enabling : strings.notifications.enableButton}
              </ActionChip>
            ) : null}
            {isTwa && permission !== 'unsupported' ? (
              <ActionChip onClick={() => openPersonnelAppNotificationSettings()}>
                <FiSmartphone className="h-3.5 w-3.5" />
                {strings.notifications.openSettingsButton}
              </ActionChip>
            ) : null}
            <ActionChip onClick={() => void refreshNotificationState()}>
              <FiRefreshCw className="h-3.5 w-3.5" />
              {strings.notifications.refreshButton}
            </ActionChip>
          </div>
        </div>
      </SettingsCard>
    );
  }

  if (view === 'about') {
    return (
      <SettingsCard>
        {releaseLoading ? (
          <p className="px-4 py-4 text-sm text-slate-500">{strings.about.loading}</p>
        ) : releaseError ? (
          <p className="px-4 py-4 text-sm text-red-600 dark:text-red-400">{releaseError}</p>
        ) : (
          <>
            <InfoRow label={strings.about.versionLabel} value={versionLabel} mono />
            {release?.publishedAt ? (
              <InfoRow label={strings.about.publishedLabel} value={formatDate(release.publishedAt)} />
            ) : null}
            {release?.fileSize ? (
              <InfoRow label={APP_NAME} value={formatApkFileSize(release.fileSize)} />
            ) : null}
          </>
        )}
        <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-800">
          {onOpenReleases ? (
            <button
              type="button"
              onClick={onOpenReleases}
              className="flex w-full items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-medium text-[#0E1548] transition hover:bg-slate-100 dark:bg-slate-800 dark:text-blue-300 dark:hover:bg-slate-700"
            >
              <span className="inline-flex items-center gap-2">
                <FiInfo className="h-4 w-4 shrink-0" />
                {strings.about.checkUpdates}
              </span>
              <FiChevronRight className="h-4 w-4 shrink-0 opacity-50" />
            </button>
          ) : (
            <Link
              href="/apk"
              className="flex w-full items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-medium text-[#0E1548] transition hover:bg-slate-100 dark:bg-slate-800 dark:text-blue-300 dark:hover:bg-slate-700"
            >
              <span className="inline-flex items-center gap-2">
                <FiInfo className="h-4 w-4 shrink-0" />
                {strings.about.checkUpdates}
              </span>
              <FiChevronRight className="h-4 w-4 shrink-0 opacity-50" />
            </Link>
          )}
          <p className="mt-2 text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
            {strings.about.apkHint}
          </p>
        </div>
      </SettingsCard>
    );
  }

  return (
    <SettingsCard>
      <button
        type="button"
        onClick={() => void handleResetData()}
        disabled={resetting}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-red-50/80 disabled:opacity-60 dark:hover:bg-red-950/20"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
          <FiTrash2 className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-slate-900 dark:text-white">
            {resetting ? strings.data.clearing : strings.data.clearLabel}
          </span>
          <span className="mt-0.5 block text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {strings.data.clearHint}
          </span>
        </span>
      </button>
    </SettingsCard>
  );
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.04] dark:bg-slate-900 dark:ring-white/10">
      {children}
    </div>
  );
}

function ThemeSegment({
  mode,
  onChange,
  strings,
}: {
  mode: PersonnelThemeMode;
  onChange: (m: PersonnelThemeMode) => void;
  strings: { light: string; dark: string; system: string };
}) {
  const options: Array<{ id: PersonnelThemeMode; label: string; icon: typeof FiSun }> = [
    { id: 'light', label: strings.light, icon: FiSun },
    { id: 'dark', label: strings.dark, icon: FiMoon },
    { id: 'system', label: strings.system, icon: FiSmartphone },
  ];

  return (
    <div
      className="mt-3 grid grid-cols-3 gap-1.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-800"
      role="group"
      aria-label={strings.light}
    >
      {options.map((opt) => {
        const active = mode === opt.id;
        const Icon = opt.icon;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            aria-pressed={active}
            className={`inline-flex flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-[11px] font-semibold transition ${
              active
                ? 'bg-white text-[#0E1548] shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Icon className="h-4 w-4" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
  showDivider = true,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  showDivider?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 px-4 py-3.5 ${
        showDivider ? 'border-b border-slate-100 dark:border-slate-800' : ''
      }`}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-white">{label}</p>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-[#0E1548] dark:bg-blue-600' : 'bg-slate-200 dark:bg-slate-600'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      <span
        className={`text-sm font-medium text-slate-900 dark:text-white ${
          mono ? 'font-mono text-[13px]' : ''
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function ActionChip({
  children,
  onClick,
  disabled,
  primary,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
        primary
          ? 'bg-[#0E1548] text-white hover:bg-[#152060] dark:bg-blue-600 dark:hover:bg-blue-500'
          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
      }`}
    >
      {children}
    </button>
  );
}
