'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FiBell, FiCheck, FiX } from 'react-icons/fi';
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

type Props = {
  tone?: 'light' | 'onDark';
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

export function PersonnelNotificationsBell({ tone = 'light', className = '' }: Props) {
  const strings = useLocalizedStrings(trStrings, enStrings);
  const { items, unreadCount, loading, markRead, markAllRead, refresh, panelOpen, openPanel, closePanel } =
    usePersonnelNotificationsContext();
  const [notificationAccess, setNotificationAccess] = useState<NotificationAccess>('default');
  const [requestingPermission, setRequestingPermission] = useState(false);
  const [isTwaApp, setIsTwaApp] = useState(false);
  const [accessReady, setAccessReady] = useState(false);
  const [mounted, setMounted] = useState(false);

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

  useEffect(() => {
    if (!panelOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

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
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [panelOpen, refresh]);

  useEffect(() => {
    if (notificationAccess !== 'granted') return;
    void registerPersonnelPushIfAuthed();
  }, [notificationAccess]);

  const bellClass =
    tone === 'onDark'
      ? 'text-white/90 hover:bg-white/10 border-white/15'
      : 'text-[#0E1548] hover:bg-[#E8EBF8] border-slate-200';

  const handleItemClick = async (id: string, href: string | null, readAt: string | null) => {
    if (!readAt) await markRead(id);
    if (href) closePanel();
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
        await registerPersonnelPushIfAuthed();
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
      await registerPersonnelPushIfAuthed();
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

  const panel = (
    <AnimatePresence>
      {panelOpen && (
        <motion.div
          className="fixed inset-0 z-[200]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-[#0E1548]/40 backdrop-blur-xl backdrop-saturate-150"
            aria-label={strings.closeOverlay}
            onClick={closePanel}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={strings.panelTitle}
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="absolute inset-x-3 top-[calc(var(--personnel-topbar-h)+0.5rem)] z-[201] mx-auto flex max-h-[min(78vh,34rem)] w-full max-w-md flex-col overflow-hidden rounded-[1.35rem] border border-white/20 bg-white shadow-[0_24px_64px_rgba(14,21,72,0.28)] dark:border-slate-700/80 dark:bg-slate-900 sm:inset-x-auto sm:right-4 sm:top-[calc(var(--personnel-topbar-h)+0.75rem)] sm:w-[min(calc(100vw-2rem),24rem)]"
          >
            <div className="relative shrink-0 border-b border-slate-100/90 bg-gradient-to-br from-[#E8EBF8] via-white to-white px-4 py-3.5 dark:border-slate-700/80 dark:from-slate-800 dark:via-slate-900 dark:to-slate-900">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0E1548] text-white shadow-md shadow-[#0E1548]/25">
                    <FiBell className="h-[1.1rem] w-[1.1rem]" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-[#0E1548] dark:text-white">{strings.panelTitle}</h2>
                    {canViewNotifications && unreadCount > 0 ? (
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {formatString(strings.unreadSummary, { count: String(unreadCount) })}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {canViewNotifications && unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => void markAllRead()}
                      className="inline-flex items-center gap-1 rounded-xl bg-white/80 px-2.5 py-1.5 text-[11px] font-semibold text-[#0E1548] shadow-sm ring-1 ring-slate-200/80 transition hover:bg-white dark:bg-slate-800 dark:text-white dark:ring-slate-600"
                    >
                      <FiCheck className="h-3.5 w-3.5" />
                      {strings.markAllRead}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={closePanel}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 text-slate-500 shadow-sm ring-1 ring-slate-200/80 transition hover:bg-white hover:text-slate-800 dark:bg-slate-800 dark:ring-slate-600 dark:hover:text-white"
                    aria-label={strings.closeOverlay}
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white dark:bg-slate-900">
              {!canViewNotifications ? (
                <div className="px-5 py-10 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8EBF8] text-2xl dark:bg-slate-800">
                    🔔
                  </div>
                  <p className="text-sm font-semibold text-[#0E1548] dark:text-white">
                    {strings.permissionRequiredTitle}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    {permissionBody()}
                  </p>
                  {isTwaApp && notificationAccess !== 'unsupported' && (
                    <div className="mt-5 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={openPersonnelAppNotificationSettings}
                        className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0E1548] px-5 py-2.5 text-sm font-semibold text-white"
                      >
                        {strings.permissionOpenAppSettingsButton}
                      </button>
                      <p className="text-xs leading-relaxed text-slate-400">{strings.permissionTwaSettingsHint}</p>
                      <button
                        type="button"
                        disabled={requestingPermission}
                        onClick={() => void recheckTwaNotificationAccess()}
                        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-[#0E1548] disabled:opacity-60 dark:border-slate-600 dark:text-white"
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
                      className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0E1548] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {requestingPermission ? strings.permissionRequesting : strings.permissionRequestButton}
                    </button>
                  )}
                  {!isTwaApp && notificationAccess === 'denied' && (
                    <button
                      type="button"
                      onClick={() => void syncNotificationAccess()}
                      className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-[#0E1548] dark:border-slate-600 dark:text-white"
                    >
                      {strings.permissionTwaConfirmButton}
                    </button>
                  )}
                </div>
              ) : loading && items.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-slate-500">{strings.loading}</p>
              ) : items.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl dark:bg-slate-800">
                    🔔
                  </div>
                  <p className="text-sm text-slate-500">{strings.empty}</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((item) => {
                    const unread = !item.read_at;
                    const content = (
                      <>
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ring-1 ${iconShellClass(item.type)}`}
                          aria-hidden
                        >
                          {iconForType(item.type)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-2">
                            <span
                              className={`text-sm font-semibold leading-snug ${
                                unread ? 'text-[#0E1548] dark:text-white' : 'text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {item.title}
                            </span>
                            {unread && (
                              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                            )}
                          </span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                            {item.body}
                          </span>
                          <span className="mt-1.5 block text-[10px] font-medium text-slate-400">
                            {formatRelativeTime(item.created_at, strings)}
                          </span>
                        </span>
                      </>
                    );

                    const rowClass = `flex w-full gap-3 px-4 py-3.5 text-left transition-colors ${
                      unread
                        ? 'bg-blue-50/60 hover:bg-blue-50 active:bg-blue-100/80 dark:bg-blue-950/20 dark:hover:bg-blue-950/30'
                        : 'hover:bg-slate-50 active:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`;

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
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => openPanel()}
        className={`relative inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${bellClass} ${className}`}
        aria-label={strings.bellAriaLabel}
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
