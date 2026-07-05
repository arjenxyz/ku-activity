'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiBell, FiCheck, FiX } from 'react-icons/fi';
import { useLocalizedStrings } from '@/lib/i18n/useLocalizedStrings';
import { formatString } from '@/lib/strings/format';
import { usePersonnelNotificationsContext } from '@/contexts/PersonnelNotificationsContext';
import trStrings from '@json/src/components/personnel/PersonnelNotificationsBell.json';
import enStrings from '@json/en/src/components/personnel/PersonnelNotificationsBell.json';
import { pushSupported, subscribePersonnelPush } from '@/lib/personnel-push-client';

type NotificationAccess = 'granted' | 'default' | 'denied' | 'unsupported';

function readNotificationAccess(): NotificationAccess {
  if (typeof window === 'undefined') return 'default';
  if (!pushSupported() || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

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

export function PersonnelNotificationsBell({ tone = 'light', className = '' }: Props) {
  const strings = useLocalizedStrings(trStrings, enStrings);
  const { items, unreadCount, loading, markRead, markAllRead, refresh, panelOpen, openPanel, closePanel } =
    usePersonnelNotificationsContext();
  const [notificationAccess, setNotificationAccess] = useState<NotificationAccess>('default');
  const [requestingPermission, setRequestingPermission] = useState(false);

  useEffect(() => {
    if (!panelOpen) return;
    const access = readNotificationAccess();
    setNotificationAccess(access);
    if (access === 'granted') void refresh();
  }, [panelOpen, refresh]);

  useEffect(() => {
    if (notificationAccess !== 'granted') return;
    void subscribePersonnelPush();
  }, [notificationAccess]);

  const bellClass =
    tone === 'onDark'
      ? 'text-white/90 hover:bg-white/10 border-white/15'
      : 'text-[#0E1548] hover:bg-[#E8EBF8] border-slate-200';

  const handleOpen = () => {
    openPanel();
  };

  const handleItemClick = async (id: string, href: string | null, readAt: string | null) => {
    if (!readAt) await markRead(id);
    if (href) closePanel();
  };

  const requestNotificationAccess = async () => {
    if (notificationAccess === 'unsupported' || notificationAccess === 'denied') return;
    setRequestingPermission(true);
    try {
      const ok = await subscribePersonnelPush({ force: true });
      const access = readNotificationAccess();
      setNotificationAccess(access);
      if (ok || access === 'granted') void refresh();
    } finally {
      setRequestingPermission(false);
    }
  };

  const canViewNotifications = notificationAccess === 'granted';
  const showUnreadBadge = canViewNotifications && unreadCount > 0;

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
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

      <AnimatePresence>
        {panelOpen && (
          <motion.div
            className="fixed inset-0 z-[90]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
              aria-label={strings.pushLater}
              onClick={closePanel}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 32 }}
              className="absolute inset-x-0 bottom-0 max-h-[min(78vh,32rem)] overflow-hidden rounded-t-[1.5rem] bg-white shadow-2xl sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <h2 className="text-base font-bold text-[#0E1548]">{strings.panelTitle}</h2>
                <div className="flex items-center gap-2">
                  {canViewNotifications && unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => void markAllRead()}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100"
                    >
                      <FiCheck className="h-3.5 w-3.5" />
                      {strings.markAllRead}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={closePanel}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto max-h-[calc(min(78vh,32rem)-3.5rem)] pb-[max(1rem,env(safe-area-inset-bottom))]">
                {!canViewNotifications ? (
                  <div className="px-4 py-10 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8EBF8] text-2xl">
                      🔔
                    </div>
                    <p className="text-sm font-semibold text-[#0E1548]">{strings.permissionRequiredTitle}</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">
                      {notificationAccess === 'unsupported'
                        ? strings.permissionUnsupportedBody
                        : notificationAccess === 'denied'
                          ? strings.permissionDeniedBody
                          : strings.permissionRequiredBody}
                    </p>
                    {notificationAccess === 'default' && (
                      <button
                        type="button"
                        disabled={requestingPermission}
                        onClick={() => void requestNotificationAccess()}
                        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0E1548] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        {requestingPermission ? strings.permissionRequesting : strings.permissionRequestButton}
                      </button>
                    )}
                  </div>
                ) : loading && items.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-slate-500">{strings.loading}</p>
                ) : items.length === 0 ? (
                  <p className="px-4 py-10 text-center text-sm text-slate-500">{strings.empty}</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {items.map((item) => {
                      const content = (
                        <>
                          <span className="mt-0.5 text-lg leading-none" aria-hidden>
                            {iconForType(item.type)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-start justify-between gap-2">
                              <span
                                className={`text-sm font-semibold leading-snug ${
                                  item.read_at ? 'text-slate-700' : 'text-[#0E1548]'
                                }`}
                              >
                                {item.title}
                              </span>
                              {!item.read_at && (
                                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                              )}
                            </span>
                            <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                              {item.body}
                            </span>
                            <span className="mt-1 block text-[10px] text-slate-400">
                              {formatRelativeTime(item.created_at, strings)}
                            </span>
                          </span>
                        </>
                      );

                      const rowClass =
                        'flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 active:bg-slate-100';

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
    </>
  );
}
