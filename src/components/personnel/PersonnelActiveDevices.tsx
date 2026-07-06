'use client';

import { useCallback, useEffect, useState } from 'react';
import type { IconType } from 'react-icons';
import { FiMonitor, FiSmartphone, FiTablet, FiHelpCircle } from 'react-icons/fi';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { formatDateTime } from '@/lib/format';
import { formatString } from '@/lib/strings/format';
import type { DeviceKind } from '@/lib/parse-user-agent';
import { getRegistryStrings } from '@/lib/i18n/strings-registry';

type DeviceStrings = ReturnType<typeof getRegistryStrings<'components/personnel/PersonnelActiveDevices'>>;

type DeviceRow = {
  sessionId: string;
  isCurrent: boolean;
  deviceKind: DeviceKind;
  deviceLabel: string;
  createdAt: string;
  lastSeenAt: string;
};

type Props = {
  onCurrentDeviceRemoved?: () => void;
  hideHeader?: boolean;
};

function formatRelativeTime(iso: string, strings: DeviceStrings) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return strings.timeJustNow;
  if (mins < 60) return formatString(strings.timeMinutesAgo, { count: String(mins) });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return formatString(strings.timeHoursAgo, { count: String(hours) });
  const days = Math.floor(hours / 24);
  return formatString(strings.timeDaysAgo, { count: String(days) });
}

function iconForKind(kind: DeviceKind): IconType {
  switch (kind) {
    case 'mobile':
      return FiSmartphone;
    case 'tablet':
      return FiTablet;
    case 'desktop':
      return FiMonitor;
    default:
      return FiHelpCircle;
  }
}

export function PersonnelActiveDevices({ onCurrentDeviceRemoved, hideHeader = false }: Props) {
  const strings = useRegistryStrings('components/personnel/PersonnelActiveDevices');
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const loadDevices = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/personnel/sessions', { credentials: 'same-origin' });
      const data = (await res.json().catch(() => ({}))) as {
        devices?: DeviceRow[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || strings.loadFailed);
      setDevices(data.devices ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [strings.loadFailed]);

  useEffect(() => {
    void loadDevices();
  }, [loadDevices]);

  const removeDevice = async (sessionId: string) => {
    setRemovingId(sessionId);
    setError(null);
    try {
      const res = await fetch(`/api/personnel/sessions/${sessionId}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; isCurrent?: boolean };
      if (!res.ok) throw new Error(data.error || strings.removeFailed);

      if (data.isCurrent) {
        onCurrentDeviceRemoved?.();
        return;
      }

      setDevices((prev) => prev.filter((d) => d.sessionId !== sessionId));
      setConfirmId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.removeFailed);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
      {!hideHeader && (
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/50">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
            {strings.sectionTitle}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            {strings.sectionHint}
          </p>
        </div>
      )}

      {loading && (
        <p className="px-4 py-6 text-sm text-slate-500 text-center">{strings.loading}</p>
      )}

      {!loading && error && (
        <div className="px-4 py-4">
          <p className="text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              void loadDevices();
            }}
            className="mt-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            {strings.retry}
          </button>
        </div>
      )}

      {!loading && !error && devices.length === 0 && (
        <p className="px-4 py-6 text-sm text-slate-500 text-center">{strings.empty}</p>
      )}

      {!loading && !error && devices.length > 0 && (
        <ul className="divide-y divide-slate-100 dark:divide-slate-700/80">
          {devices.map((device) => {
            const Icon = iconForKind(device.deviceKind);
            const label = device.deviceLabel || strings.unknownDevice;
            const isConfirming = confirmId === device.sessionId;
            const isRemoving = removingId === device.sessionId;

            return (
              <li key={device.sessionId} className="px-4 py-3.5">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    <Icon className="w-4 h-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{label}</p>
                      {device.isCurrent && (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                          {strings.thisDevice}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatString(strings.lastActive, {
                        time: formatRelativeTime(device.lastSeenAt, strings),
                      })}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatString(strings.signedInAt, {
                        date: formatDateTime(device.createdAt),
                      })}
                    </p>

                    {!device.isCurrent && (
                      <div className="mt-2">
                        {isConfirming ? (
                          <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/80 dark:bg-red-950/20 p-3">
                            <p className="text-xs font-medium text-red-800 dark:text-red-200">
                              {strings.confirmRemoveTitle}
                            </p>
                            <p className="text-xs text-red-700/90 dark:text-red-300/90 mt-1 leading-relaxed">
                              {strings.confirmRemoveBody}
                            </p>
                            <div className="mt-2 flex gap-2">
                              <button
                                type="button"
                                disabled={isRemoving}
                                onClick={() => void removeDevice(device.sessionId)}
                                className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-60"
                              >
                                {isRemoving ? strings.removing : strings.confirmRemoveAction}
                              </button>
                              <button
                                type="button"
                                disabled={isRemoving}
                                onClick={() => setConfirmId(null)}
                                className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 disabled:opacity-60"
                              >
                                {strings.cancel}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmId(device.sessionId)}
                            className="text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            {strings.remove}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
