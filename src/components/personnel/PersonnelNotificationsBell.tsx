'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FiArrowLeft, FiBell, FiCheck, FiTrash2 } from 'react-icons/fi';
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

function iconForType(type: string) {
  switch (type) {
    case 'attendance_reminder':
    case 'attendance_session_cancelled':
    case 'attendance_removed_from_list':
    case 'attendance_session_completed':
      return '📋';
    case 'advance_approved':
    case 'advance_cash_ready':
    case 'advance_rejected':
    case 'advance_paid':
      return '💳';
    case 'salary_paid':
    case 'minimum_wage_paid':
      return '💰';
    case 'deduction_added':
      return '📉';
    default:
      return '🔔';
  }
}

function iconShellClass(type: string) {
  switch (type) {
    case 'advance_approved':
    case 'advance_cash_ready':
    case 'advance_paid':
      return 'bg-indigo-50 text-indigo-700 ring-indigo-100';
    case 'advance_rejected':
      return 'bg-rose-50 text-rose-700 ring-rose-100';
    case 'attendance_reminder':
    case 'attendance_session_completed':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-100';
    case 'attendance_session_cancelled':
    case 'attendance_removed_from_list':
      return 'bg-amber-50 text-amber-800 ring-amber-100';
    case 'salary_paid':
    case 'minimum_wage_paid':
      return 'bg-sky-50 text-sky-700 ring-sky-100';
    case 'deduction_added':
      return 'bg-orange-50 text-orange-700 ring-orange-100';
    default:
      return 'bg-slate-100 text-slate-700 ring-slate-200/80';
  }
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

  useEffect(() => {
    setMounted(true);
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
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg ring-1 ${iconShellClass(item.type)}`}
          aria-hidden
        >
          {iconForType(item.type)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-2">
            <span
              className={`text-[15px] font-semibold leading-snug ${
                unread ? 'text-[#0E1548] dark:text-white' : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              {item.title}
            </span>
            {unread && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
          </span>
          <span className="mt-1 block text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            {item.body}
          </span>
          <span className="mt-2 block text-[11px] font-medium text-slate-400">
            {formatRelativeTime(item.created_at, strings)}
          </span>
        </span>
        <button
          type="button"
          onClick={(event) => void handleDelete(item.id, event)}
          disabled={deletingId === item.id}
          aria-label={strings.deleteAriaLabel}
          className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
        >
          <FiTrash2 className="h-4 w-4" />
        </button>
      </>
    );

    const rowClass = `flex w-full gap-3 px-4 py-4 text-left transition-colors ${
      unread
        ? 'bg-blue-50/50 hover:bg-blue-50 active:bg-blue-100/70 dark:bg-blue-950/15 dark:hover:bg-blue-950/25'
        : 'hover:bg-slate-50 active:bg-slate-100 dark:hover:bg-slate-800/50'
    }`;

    if (item.href) {
      return (
        <li key={item.id} className="border-b border-slate-100 last:border-b-0 dark:border-slate-800">
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
      <li key={item.id} className="border-b border-slate-100 last:border-b-0 dark:border-slate-800">
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
          className="fixed inset-0 z-[var(--personnel-notify-z)] flex flex-col bg-[#F4F6FC] dark:bg-slate-950"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: 'spring', stiffness: 380, damping: 36 }}
        >
          <header className="safe-pt shrink-0 border-b border-slate-200/80 bg-white px-3 pb-3 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={closePanel}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#0E1548] transition hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800"
                aria-label={strings.back}
              >
                <FiArrowLeft className="h-5 w-5" />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-bold text-[#0E1548] dark:text-white">{strings.panelTitle}</h1>
                {canViewNotifications && items.length > 0 ? (
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {unreadCount > 0
                      ? formatString(strings.unreadSummary, { count: String(unreadCount) })
                      : formatString(strings.totalSummary, { count: String(items.length) })}
                  </p>
                ) : null}
              </div>
              {canViewNotifications && items.length > 0 && (
                <div className="flex shrink-0 items-center gap-1.5">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => void markAllRead()}
                      className="inline-flex h-9 items-center gap-1 rounded-xl bg-[#E8EBF8] px-2.5 text-[11px] font-semibold text-[#0E1548] transition hover:bg-[#DDE2F5] dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
                    >
                      <FiCheck className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{strings.markAllRead}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setClearConfirmOpen(true)}
                    className="inline-flex h-9 items-center gap-1 rounded-xl px-2.5 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                  >
                    <FiTrash2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{strings.clearAll}</span>
                  </button>
                </div>
              )}
            </div>
          </header>

          {clearConfirmOpen && (
            <div className="shrink-0 border-b border-rose-100 bg-rose-50 px-4 py-3 dark:border-rose-900/50 dark:bg-rose-950/30">
              <p className="text-sm font-medium text-rose-800 dark:text-rose-200">{strings.clearAllConfirm}</p>
              <div className="mt-2.5 flex gap-2">
                <button
                  type="button"
                  disabled={clearingAll}
                  onClick={() => void handleClearAll()}
                  className="inline-flex min-h-9 flex-1 items-center justify-center rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {strings.clearAllConfirmButton}
                </button>
                <button
                  type="button"
                  disabled={clearingAll}
                  onClick={() => setClearConfirmOpen(false)}
                  className="inline-flex min-h-9 items-center justify-center rounded-xl border border-rose-200 bg-white px-4 text-sm font-semibold text-rose-700 dark:border-rose-800 dark:bg-slate-900 dark:text-rose-300"
                >
                  {strings.clearAllCancel}
                </button>
              </div>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-none safe-pb" data-allow-scroll>
            {!canViewNotifications ? (
              <div className="flex min-h-full flex-col items-center justify-center px-6 py-12 text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-3xl shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-900 dark:ring-slate-700">
                  🔔
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
                    className="mt-6 inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#0E1548] px-6 text-sm font-semibold text-white disabled:opacity-60"
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
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-white text-2xl shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-900 dark:ring-slate-700">
                  🔔
                </div>
                <p className="text-sm text-slate-500">{strings.empty}</p>
              </div>
            ) : (
              <ul className="mx-auto w-full max-w-2xl py-2">{items.map(renderNotificationRow)}</ul>
            )}
          </div>
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
