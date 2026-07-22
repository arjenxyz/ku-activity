'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  FiBell,
  FiInfo,
  FiRefreshCw,
  FiSmartphone,
  FiTrash2,
} from 'react-icons/fi';
import { LanguageSwitch } from '@/components/i18n/LanguageSwitch';
import { HonorIconTile } from '@/components/icons/HonorIcons';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { clearPersonnelClientData } from '@/lib/personnel-data-reset';
import { usePersonnelDisplay } from '@/lib/personnel-display-preferences';
import { getNotificationPermission, requestNotificationPermission } from '@/lib/personnel-push-client';
import { isAdminTwaRuntime, openAdminAppNotificationSettings } from '@/lib/admin-app-runtime';
import { formatDate } from '@/lib/format';
import { formatApkFileSize } from '@/lib/app-releases';
import { APP_NAME } from '@/lib/brand';
import { AdminUiModeToggle } from '@/components/dashboard/AdminUiModeToggle';

type AdminRelease = {
  appType: string;
  id: string | null;
  versionName?: string;
  versionCode?: number;
  fileSize?: number;
  publishedAt?: string | null;
};

export function AdminAppSettings() {
  const strings = useRegistryStrings('components/admin/AdminAppSettings');
  const { largeText, highContrast, setLargeText, setHighContrast } = usePersonnelDisplay();

  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [notifyBusy, setNotifyBusy] = useState(false);
  const [isTwa, setIsTwa] = useState(false);

  const [release, setRelease] = useState<AdminRelease | null>(null);
  const [releaseLoading, setReleaseLoading] = useState(true);
  const [releaseError, setReleaseError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  const refreshNotificationState = useCallback(async () => {
    setPermission(getNotificationPermission());
  }, []);

  useEffect(() => {
    setIsTwa(isAdminTwaRuntime());
    void refreshNotificationState();
  }, [refreshNotificationState]);

  useEffect(() => {
    let cancelled = false;
    setReleaseLoading(true);
    setReleaseError(null);
    fetch('/api/public/releases')
      .then(async (res) => {
        const data = (await res.json()) as { releases?: AdminRelease[]; error?: string };
        if (!res.ok) throw new Error(data.error || strings.about.loadFailed);
        const admin = (data.releases ?? []).find((row) => row.appType === 'admin');
        if (!cancelled) setRelease(admin ?? null);
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
  }, [strings.about.loadFailed]);

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
        openAdminAppNotificationSettings();
        await requestNotificationPermission({ twaAfterSettings: true });
      } else {
        await requestNotificationPermission();
      }
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
      await fetch('/api/auth/admin/logout', { method: 'POST' }).catch(() => {});
      await clearPersonnelClientData();
    } finally {
      window.location.replace('/admin-panel/login');
    }
  };

  const versionLabel = release?.versionName
    ? release.versionCode
      ? `v${release.versionName} (${release.versionCode})`
      : `v${release.versionName}`
    : strings.about.unknownVersion;

  return (
    <div className="space-y-4">
      <p className="text-center text-xs leading-relaxed text-slate-500">{strings.pageSubtitle}</p>

      <SettingsSection title={strings.sections.display} icon="settings" theme="slate">
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
      </SettingsSection>

      <SettingsSection title={strings.sections.language} icon="globe" theme="teal">
        <div className="px-4 py-3.5">
          <div className="mb-3">
            <p className="text-sm font-medium text-slate-900">{strings.languageLabel}</p>
            <p className="mt-0.5 text-xs text-slate-500">{strings.languageHint}</p>
          </div>
          <LanguageSwitch variant="list" />
        </div>
      </SettingsSection>

      <SettingsSection title={strings.sections.interface} icon="sliders" theme="violet">
        <div className="px-4 py-3.5">
          <p className="text-sm font-medium text-slate-900">{strings.interfaceLabel}</p>
          <p className="mt-0.5 text-xs text-slate-500">{strings.interfaceHint}</p>
          <div className="mt-3">
            <AdminUiModeToggle />
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title={strings.sections.notifications} icon="inbox" theme="indigo">
        <InfoRow label={strings.notifications.statusLabel} value={permissionLabel} />
        <div className="border-t border-slate-100 px-4 py-3">
          <p className="text-xs leading-relaxed text-slate-500">{permissionHint}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {permission !== 'granted' && permission !== 'unsupported' ? (
              <ActionChip onClick={() => void handleEnableNotifications()} disabled={notifyBusy} primary>
                <FiBell className="h-3.5 w-3.5" />
                {notifyBusy ? strings.notifications.enabling : strings.notifications.enableButton}
              </ActionChip>
            ) : null}
            {isTwa && permission !== 'unsupported' ? (
              <ActionChip onClick={() => openAdminAppNotificationSettings()}>
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
      </SettingsSection>

      <SettingsSection title={strings.sections.about} icon="document" theme="sky">
        {releaseLoading ? (
          <p className="px-4 py-4 text-sm text-slate-500">{strings.about.loading}</p>
        ) : releaseError ? (
          <p className="px-4 py-4 text-sm text-red-600">{releaseError}</p>
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
        <div className="border-t border-slate-100 px-4 py-3">
          <a
            href="/apk"
            className="flex w-full items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-medium text-[#0E1548] transition hover:bg-slate-100"
          >
            <FiInfo className="h-4 w-4 shrink-0" />
            {strings.about.checkUpdates}
          </a>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-400">{strings.about.apkHint}</p>
        </div>
      </SettingsSection>

      <SettingsSection title={strings.sections.data} icon="shield" theme="rose">
        <button
          type="button"
          onClick={() => void handleResetData()}
          disabled={resetting}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-red-50/80 disabled:opacity-60"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <FiTrash2 className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-slate-900">
              {resetting ? strings.data.clearing : strings.data.clearLabel}
            </span>
            <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
              {strings.data.clearHint}
            </span>
          </span>
        </button>
      </SettingsSection>
    </div>
  );
}

function SettingsSection({
  title,
  icon,
  theme,
  children,
}: {
  title: string;
  icon: 'settings' | 'globe' | 'inbox' | 'document' | 'shield' | 'sliders';
  theme: 'slate' | 'teal' | 'violet' | 'sky' | 'rose' | 'indigo';
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.04]">
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-3">
        <HonorIconTile name={icon} theme={theme} size="sm" muted />
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      </div>
      <div className="divide-y divide-slate-100">{children}</div>
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
    <div className={`flex items-center justify-between gap-4 px-4 py-3.5 ${showDivider ? '' : ''}`}>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="mt-0.5 text-xs text-slate-500">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-[#0E1548]' : 'bg-slate-200'
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
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-sm font-medium text-slate-900 ${mono ? 'font-mono text-[13px]' : ''}`}>
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
          ? 'bg-[#0E1548] text-white hover:bg-[#152060]'
          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  );
}
