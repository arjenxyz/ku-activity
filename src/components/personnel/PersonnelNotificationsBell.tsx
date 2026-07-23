'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FiArrowLeft, FiBell, FiEye, FiSettings, FiTrash2 } from 'react-icons/fi';
import { BrandMark } from '@/components/brand/BrandMark';
import {
  HonorIconTile,
} from '@/components/icons/HonorIcons';
import { useLocalizedStrings } from '@/lib/i18n/useLocalizedStrings';
import { formatString } from '@/lib/strings/format';
import { usePersonnelNotificationsContext } from '@/contexts/PersonnelNotificationsContext';
import trStrings from '@json/src/components/personnel/PersonnelNotificationsBell.json';
import enStrings from '@json/en/src/components/personnel/PersonnelNotificationsBell.json';
import { isPersonnelTwaRuntime, openPersonnelAppNotificationSettings } from '@/lib/personnel-app-runtime';
import {
  markNotificationsUnlocked,
  resolvePersonnelNotificationAccess,
  type NotificationAccess,
} from '@/lib/personnel-notification-access';
import {
  isNotificationSoundEnabled,
  isNotificationsMuted,
  setNotificationSoundEnabled,
  setNotificationsMuted,
} from '@/lib/personnel-notification-storage';
import {
  registerPersonnelPushIfAuthed,
  requestNotificationPermission,
} from '@/lib/personnel-push-client';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

type Props = {
  tone?: 'light' | 'onDark';
  panelOpen?: boolean;
  className?: string;
};

function formatRelativeTime(iso: string, strings: typeof trStrings) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return strings.timeJustNow;
  if (mins < 60) return formatString(strings.timeMinutesAgo, { count: String(mins) });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return formatString(strings.timeHoursAgo, { count: String(hours) });
  const days = Math.floor(hours / 24);
  return formatString(strings.timeDaysAgo, { count: String(days) });
}

export function PersonnelNotificationsBell({ tone = 'light', panelOpen: panelOpenProp, className = '' }: Props) {
  const strings = useLocalizedStrings(trStrings, enStrings);
  const {
    items,
    unreadCount,
    loading,
    markRead,
    markAllRead,
    deleteNotification,
    clearAllNotifications,
    refresh,
    panelOpen: panelOpenCtx,
    openPanel,
    closePanel,
  } = usePersonnelNotificationsContext();
  const panelOpen = panelOpenProp ?? panelOpenCtx;
  const [notificationAccess, setNotificationAccess] = useState<NotificationAccess>('default');
  const [requestingPermission, setRequestingPermission] = useState(false);
  const [isTwaApp, setIsTwaApp] = useState(false);
  const [accessReady, setAccessReady] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    setMounted(true);
    setMuted(isNotificationsMuted());
    setSoundEnabled(isNotificationSoundEnabled());
  }, []);

  useEffect(() => {
    setIsTwaApp(isPersonnelTwaRuntime());
    void resolvePersonnelNotificationAccess().then((access) => {
      setNotificationAccess(access);
      setAccessReady(true);
    });
  }, []);

  const syncNotificationAccess = async () => {
    const access = await resolvePersonnelNotificationAccess();
    setNotificationAccess(access);
    return access;
  };

  useBodyScrollLock(panelOpen);

  useEffect(() => {
    if (!panelOpen) {
      setClearConfirmOpen(false);
      setSettingsOpen(false);
      return;
    }

    void syncNotificationAccess().then((access) => {
      if (access === 'granted') void refresh();
    });

    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      void syncNotificationAccess().then((access) => {
        if (access === 'granted') void refresh();
      });
    };

    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [panelOpen, refresh]);

  useEffect(() => {
    if (notificationAccess !== 'granted') return;
    void registerPersonnelPushIfAuthed({ twaBypassPermission: isTwaApp });
  }, [notificationAccess, isTwaApp]);

  const bellClass =
    tone === 'onDark'
      ? 'text-white/90 hover:bg-white/10 border-white/15'
      : 'text-[#0E1548] hover:bg-[#E8EBF8] border-slate-200';

  const handleItemClick = async (id: string, href: string | null, readAt: string | null) => {
    if (!readAt) await markRead(id);
    if (href) closePanel();
  };

  const handleDelete = async (id: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (deletingId) return;
    setDeletingId(id);
    try {
      await deleteNotification(id);
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    if (clearingAll) return;
    setClearingAll(true);
    try {
      const ok = await clearAllNotifications();
      if (ok) setClearConfirmOpen(false);
    } finally {
      setClearingAll(false);
    }
  };

  const requestBrowserNotificationAccess = async () => {
    if (notificationAccess === 'unsupported' || notificationAccess === 'denied') return;
    setRequestingPermission(true);
    try {
      const permission = await requestNotificationPermission();
      const access: NotificationAccess =
        permission === 'unsupported' ? 'unsupported' : permission;
      if (access === 'granted') {
        markNotificationsUnlocked();
        setNotificationAccess('granted');
        await registerPersonnelPushIfAuthed({ twaBypassPermission: isTwaApp });
        void refresh();
      } else {
        setNotificationAccess(access);
      }
    } finally {
      setRequestingPermission(false);
    }
  };

  const recheckTwaNotificationAccess = async () => {
    setRequestingPermission(true);
    try {
      await requestNotificationPermission({ twaAfterSettings: true });
      await registerPersonnelPushIfAuthed({ force: true, twaBypassPermission: true });
      const access = await syncNotificationAccess();
      if (access === 'granted') void refresh();
    } finally {
      setRequestingPermission(false);
    }
  };

  const permissionBody = () => {
    if (notificationAccess === 'unsupported') return strings.permissionUnsupportedBody;
    if (notificationAccess === 'denied') {
      return isTwaApp ? strings.permissionDeniedTwaBody : strings.permissionDeniedBody;
    }
    return isTwaApp ? strings.permissionRequiredTwaBody : strings.permissionRequiredBody;
  };

  const canViewNotifications = notificationAccess === 'granted';
  const showUnreadBadge = accessReady && canViewNotifications && unreadCount > 0;

  const renderNotificationRow = (item: (typeof items)[number]) => {
    const unread = !item.read_at;
    const content = (
      <>
        <span
          className={`relative inline-flex h-8 w-8 shrink-0 items-center justify-center self-center rounded-xl ${
            unread
              ? 'bg-[#0E1548]/[0.08] text-[#0E1548] dark:bg-white/10 dark:text-white'
              : 'bg-slate-100/90 text-slate-500 dark:bg-slate-800/80 dark:text-slate-400'
          }`}
        >
          <FiBell className="h-4 w-4" strokeWidth={2} aria-hidden />
          {unread ? (
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#3B7FED] ring-2 ring-white dark:ring-slate-950" />
          ) : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span
              className={`min-w-0 truncate text-sm font-semibold leading-tight tracking-tight ${
                unread ? 'text-[#0E1548] dark:text-white' : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              {item.title}
            </span>
            <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-slate-400">
              {formatRelativeTime(item.created_at, strings)}
            </span>
          </span>
          <span className="mt-0.5 line-clamp-2 text-xs leading-snug text-slate-500 dark:text-slate-400">
            {item.body}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-0.5 self-center">
          <button
            type="button"
            onClick={(event) => void handleDelete(item.id, event)}
            disabled={deletingId === item.id}
            aria-label={strings.deleteAriaLabel}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-600 transition hover:bg-rose-50/80 hover:text-rose-700 disabled:opacity-50 dark:text-rose-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
          >
            <FiTrash2 className="h-3.5 w-3.5" />
          </button>
          {item.href ? (
            <FiArrowLeft className="h-3.5 w-3.5 rotate-180 text-slate-300 dark:text-slate-600" aria-hidden />
          ) : null}
        </span>
      </>
    );

    const rowClass = `relative flex w-full items-start gap-2.5 rounded-xl border px-2.5 py-2 text-left transition-all active:scale-[0.99] backdrop-blur-xl ${
      unread
        ? 'border-slate-200/95 bg-white/80 shadow-sm shadow-slate-900/[0.06] dark:border-slate-600/70 dark:bg-white/10'
        : 'border-slate-200/80 bg-white/60 shadow-sm shadow-slate-900/[0.04] dark:border-slate-700/60 dark:bg-white/[0.06]'
    } hover:border-slate-300 hover:bg-white/90 dark:hover:border-slate-500 dark:hover:bg-white/15`;

    if (item.href) {
      return (
        <li key={item.id}>
          <Link
            href={item.href}
            className={rowClass}
            onClick={() => void handleItemClick(item.id, item.href, item.read_at)}
          >
            {content}
          </Link>
        </li>
      );
    }

    return (
      <li key={item.id}>
        <button
          type="button"
          className={rowClass}
          onClick={() => void handleItemClick(item.id, null, item.read_at)}
        >
          {content}
        </button>
      </li>
    );
  };

  const panel = (
    <AnimatePresence>
      {panelOpen && (
        <motion.div
          className="fixed inset-0 z-[var(--personnel-notify-z)] flex flex-col bg-slate-900/25 backdrop-blur-xl dark:bg-black/40"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: 'spring', stiffness: 380, damping: 36 }}
        >
          <header className="safe-pt shrink-0 bg-transparent px-3 pb-2">
            <div className="mx-auto max-w-5xl">
              <div className="flex h-14 items-center justify-between gap-3 rounded-2xl border border-white/40 bg-white/55 px-3 shadow-md shadow-slate-900/[0.08] backdrop-blur-2xl dark:border-white/10 dark:bg-white/10 dark:shadow-black/25 sm:px-4">
                <button
                  type="button"
                  onClick={closePanel}
                  className="flex min-w-0 flex-1 items-center gap-2.5 text-left transition-opacity hover:opacity-90 active:opacity-80"
                  aria-label={strings.exitAriaLabel}
                >
                  <BrandMark
                    size="sm"
                    className="shrink-0 shadow-md ring-2 ring-[#0E1548]/10 dark:ring-white/15"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-bold leading-tight text-[#0E1548] dark:text-white">
                      {strings.panelTitle}
                    </p>
                    <p className="truncate text-[10px] font-medium leading-tight text-slate-500 dark:text-slate-400">
                      {strings.exitHint}
                    </p>
                  </div>
                </button>

                {canViewNotifications ? (
                  <div className="flex shrink-0 items-center gap-0.5 rounded-xl bg-white/40 p-0.5 backdrop-blur-md dark:bg-white/10">
                    <button
                      type="button"
                      onClick={() => setSettingsOpen((open) => !open)}
                      className={`inline-flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-white dark:hover:bg-slate-700 ${
                        settingsOpen || muted
                          ? 'text-[#3B7FED] dark:text-sky-300'
                          : 'text-[#0E1548] dark:text-white'
                      }`}
                      aria-label={strings.settingsAriaLabel}
                      title={strings.settingsAriaLabel}
                      aria-expanded={settingsOpen}
                    >
                      <FiSettings className="h-[1.05rem] w-[1.05rem]" />
                    </button>
                  </div>
                ) : (
                  <div className="flex shrink-0 rounded-xl bg-slate-100/80 p-0.5 dark:bg-slate-800/80">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-[#0E1548] dark:text-white">
                      <FiBell className="h-[1.05rem] w-[1.05rem]" aria-hidden />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {settingsOpen && canViewNotifications && (
            <div className="shrink-0 px-3 pb-2">
              <div className="mx-auto max-w-5xl rounded-2xl border border-white/40 bg-white/70 px-4 py-3 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/10">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[#0E1548] dark:text-white">
                    {strings.settingsTitle}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSettingsOpen(false)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    {strings.settingsClose}
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  <label className="flex cursor-pointer items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-[#0E1548] dark:text-white">
                        {strings.settingsMuteLabel}
                      </span>
                      <span className="mt-0.5 block text-xs leading-snug text-slate-500 dark:text-slate-400">
                        {strings.settingsMuteHint}
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-[#0E1548] focus:ring-[#3B7FED]"
                      checked={muted}
                      onChange={(event) => {
                        const next = event.target.checked;
                        setMuted(next);
                        setNotificationsMuted(next);
                      }}
                    />
                  </label>
                  <label
                    className={`flex items-start justify-between gap-3 ${
                      muted ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-[#0E1548] dark:text-white">
                        {strings.settingsSoundLabel}
                      </span>
                      <span className="mt-0.5 block text-xs leading-snug text-slate-500 dark:text-slate-400">
                        {strings.settingsSoundHint}
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-[#0E1548] focus:ring-[#3B7FED]"
                      checked={soundEnabled && !muted}
                      disabled={muted}
                      onChange={(event) => {
                        const next = event.target.checked;
                        setSoundEnabled(next);
                        setNotificationSoundEnabled(next);
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {clearConfirmOpen && (
            <div className="shrink-0 px-3 pb-2">
              <div className="mx-auto max-w-5xl rounded-2xl border border-rose-200/80 bg-rose-50 px-4 py-3 shadow-sm dark:border-rose-900/50 dark:bg-rose-950/30">
                <p className="text-sm font-medium text-rose-800 dark:text-rose-200">{strings.clearAllConfirm}</p>
                <div className="mt-2.5 flex gap-2">
                  <button
                    type="button"
                    disabled={clearingAll}
                    onClick={() => void handleClearAll()}
                    className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {strings.clearAllConfirmButton}
                  </button>
                  <button
                    type="button"
                    disabled={clearingAll}
                    onClick={() => setClearConfirmOpen(false)}
                    className="inline-flex min-h-10 items-center justify-center rounded-xl border border-rose-200 bg-white px-4 text-sm font-semibold text-rose-700 dark:border-rose-800 dark:bg-slate-900 dark:text-rose-300"
                  >
                    {strings.clearAllCancel}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-none" data-allow-scroll>
            {!canViewNotifications ? (
              <div className="flex min-h-full flex-col items-center justify-center px-6 py-12 text-center">
                <div className="relative mb-6">
                  <div
                    className="absolute inset-0 scale-150 rounded-full bg-violet-400/20 blur-2xl"
                    aria-hidden
                  />
                  <HonorIconTile
                    name="bell"
                    theme="violet"
                    size="xl"
                    className="relative shadow-lg shadow-violet-500/25"
                  />
                </div>
                <p className="text-base font-semibold text-[#0E1548] dark:text-white">
                  {strings.permissionRequiredTitle}
                </p>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {permissionBody()}
                </p>
                {isTwaApp && notificationAccess !== 'unsupported' && (
                  <div className="mt-6 flex w-full max-w-sm flex-col gap-2">
                    <button
                      type="button"
                      onClick={openPersonnelAppNotificationSettings}
                      className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#0E1548] px-5 text-sm font-semibold text-white"
                    >
                      {strings.permissionOpenAppSettingsButton}
                    </button>
                    <p className="text-xs leading-relaxed text-slate-400">{strings.permissionTwaSettingsHint}</p>
                    <button
                      type="button"
                      disabled={requestingPermission}
                      onClick={() => void recheckTwaNotificationAccess()}
                      className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-[#0E1548] disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                    >
                      {requestingPermission
                        ? strings.permissionRequesting
                        : strings.permissionTwaConfirmButton}
                    </button>
                  </div>
                )}
                {!isTwaApp && notificationAccess === 'default' && (
                  <button
                    type="button"
                    disabled={requestingPermission}
                    onClick={() => void requestBrowserNotificationAccess()}
                    className="mt-6 inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#0E1548] px-6 text-sm font-semibold text-white shadow-md shadow-[#0E1548]/20 disabled:opacity-60"
                  >
                    {requestingPermission ? strings.permissionRequesting : strings.permissionRequestButton}
                  </button>
                )}
                {!isTwaApp && notificationAccess === 'denied' && (
                  <button
                    type="button"
                    onClick={() => void syncNotificationAccess()}
                    className="mt-6 inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-semibold text-[#0E1548] dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                  >
                    {strings.permissionTwaConfirmButton}
                  </button>
                )}
              </div>
            ) : loading && items.length === 0 ? (
              <p className="px-4 py-16 text-center text-sm text-slate-500">{strings.loading}</p>
            ) : items.length === 0 ? (
              <div className="flex min-h-full flex-col items-center justify-center px-6 py-16 text-center">
                <div className="relative mb-5">
                  <div
                    className="absolute inset-0 scale-150 rounded-full bg-violet-400/15 blur-xl"
                    aria-hidden
                  />
                  <HonorIconTile
                    name="bell"
                    theme="violet"
                    size="lg"
                    className="relative shadow-md shadow-violet-500/20"
                  />
                </div>
                <p className="text-sm text-slate-500">{strings.empty}</p>
              </div>
            ) : (
              <ul className="mx-auto flex w-full max-w-5xl flex-col gap-1.5 px-3 py-1.5 sm:px-4">
                {items.map(renderNotificationRow)}
              </ul>
            )}
          </div>

          {canViewNotifications && items.length > 0 ? (
            <footer className="safe-pb shrink-0 px-3 pt-2">
              <div className="mx-auto flex max-w-5xl justify-center">
                <div className="flex items-center gap-0.5 rounded-2xl border border-white/40 bg-white/70 p-1 shadow-md shadow-slate-900/[0.08] backdrop-blur-2xl dark:border-white/10 dark:bg-white/10 dark:shadow-black/25">
                  {unreadCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => void markAllRead()}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-[#0E1548] transition hover:bg-white/90 dark:text-white dark:hover:bg-white/15"
                      aria-label={strings.markAllRead}
                      title={strings.markAllRead}
                    >
                      <FiEye className="h-5 w-5" />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setClearConfirmOpen(true)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-rose-600 transition hover:bg-white/90 dark:text-rose-400 dark:hover:bg-white/15"
                    aria-label={strings.clearAll}
                    title={strings.clearAll}
                  >
                    <FiTrash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </footer>
          ) : null}
        </motion.div>
      )}
    </AnimatePresence>
  );

  const bellActiveClass = panelOpen
    ? tone === 'onDark'
      ? '!text-[#0E1548]'
      : '!text-white !border-transparent'
    : '';

  return (
    <>
      <button
        type="button"
        onClick={() => (panelOpen ? closePanel() : openPanel())}
        className={`relative inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${bellClass} ${className} ${bellActiveClass}`}
        aria-label={strings.bellAriaLabel}
        aria-expanded={panelOpen}
      >
        <FiBell className="h-[1.05rem] w-[1.05rem]" />
        {showUnreadBadge && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {mounted ? createPortal(panel, document.body) : null}
    </>
  );
}
