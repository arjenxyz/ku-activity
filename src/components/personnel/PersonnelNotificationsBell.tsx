'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import { FiArrowLeft, FiBell, FiChevronRight, FiEye, FiSettings, FiTrash2, FiVolume2, FiX } from 'react-icons/fi';
import { BrandMark } from '@/components/brand/BrandMark';
import {
  HonorIconTile,
} from '@/components/icons/HonorIcons';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { getRegistryStrings } from '@/lib/i18n/strings-registry';
import { formatString } from '@/lib/strings/format';
import { resolvePersonnelNotificationCopy } from '@/lib/personnel-notification-i18n';
import { usePersonnelNotificationsContext } from '@/contexts/PersonnelNotificationsContext';
import { isPersonnelTwaRuntime, openPersonnelAppNotificationSettings } from '@/lib/personnel-app-runtime';
import {
  markNotificationsUnlocked,
  resolvePersonnelNotificationAccess,
  type NotificationAccess,
} from '@/lib/personnel-notification-access';
import {
  getNotificationSoundId,
  isNotificationSoundEnabled,
  isNotificationsMuted,
  setNotificationSoundEnabled,
  setNotificationSoundId,
  setNotificationsMuted,
  type NotificationSoundId,
} from '@/lib/personnel-notification-storage';
import {
  NOTIFICATION_SOUND_OPTIONS,
  playInAppNotificationSound,
} from '@/lib/in-app-notification-sound';
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

const SWIPE_PEEK = 72;
/** Sil / okundu için bırakma eşiği — yanlışlıkla tetiklenmesin */
const SWIPE_COMMIT_OFFSET = 132;
/** Hızlı fırlatmada da en az bu kadar kaydırılmış olmalı */
const SWIPE_COMMIT_MIN_OFFSET = 96;
const SWIPE_COMMIT_VELOCITY = 1100;

function SettingsToggle({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${
        checked ? 'bg-[#3B7FED]' : 'bg-slate-300 dark:bg-slate-600'
      } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B7FED]/40`}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
          checked ? 'left-[1.375rem]' : 'left-0.5'
        }`}
      />
    </button>
  );
}

type NotificationBellStrings = ReturnType<
  typeof getRegistryStrings<'components/personnel/PersonnelNotificationsBell'>
>;

function formatRelativeTime(iso: string, strings: NotificationBellStrings) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return strings.timeJustNow;
  if (mins < 60) return formatString(strings.timeMinutesAgo, { count: String(mins) });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return formatString(strings.timeHoursAgo, { count: String(hours) });
  const days = Math.floor(hours / 24);
  return formatString(strings.timeDaysAgo, { count: String(days) });
}

/** Eski bildirimlerdeki "Detay: …" ekini gizle */
function sanitizeNotificationBody(body: string) {
  return body.replace(/\s*Detay:\s*.+$/i, '').replace(/\s*Detail:\s*.+$/i, '').trim();
}

function NotificationRowContent({
  unread,
  title,
  body,
  timeLabel,
  showChevron = false,
}: {
  unread: boolean;
  title: string;
  body: string;
  timeLabel: string;
  showChevron?: boolean;
}) {
  return (
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
            {title}
          </span>
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
            {timeLabel}
          </span>
        </span>
        <span className="mt-0.5 line-clamp-2 text-xs leading-snug text-slate-500 dark:text-slate-400">
          {body}
        </span>
      </span>
      {showChevron ? (
        <FiArrowLeft
          className="h-3.5 w-3.5 shrink-0 rotate-180 self-center text-slate-300 dark:text-slate-600"
          aria-hidden
        />
      ) : null}
    </>
  );
}

function SwipeNotificationRow({
  children,
  onDelete,
  onMarkRead,
  canMarkRead = false,
  disabled,
  hints,
}: {
  children: ReactNode;
  onDelete: () => void;
  onMarkRead?: () => void;
  canMarkRead?: boolean;
  disabled?: boolean;
  hints: {
    cancel: string;
    almost: string;
    deleteReady: string;
    readReady: string;
  };
}) {
  const draggedRef = useRef(false);
  const [leaving, setLeaving] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [activeSide, setActiveSide] = useState<'delete' | 'read' | null>(null);
  const deleteStartedRef = useRef(false);
  const x = useMotionValue(0);
  const deleteReveal = useTransform(x, [-4, -20], [0, 1]);
  const readReveal = useTransform(x, [4, 20], [0, 1]);

  const updateHintFromX = (value: number) => {
    if (value <= -SWIPE_COMMIT_OFFSET) {
      setActiveSide('delete');
      setHint(hints.deleteReady);
      return;
    }
    if (value <= -SWIPE_PEEK) {
      setActiveSide('delete');
      setHint(hints.almost);
      return;
    }
    if (value < -16) {
      setActiveSide('delete');
      setHint(hints.cancel);
      return;
    }
    if (canMarkRead && value >= SWIPE_COMMIT_OFFSET) {
      setActiveSide('read');
      setHint(hints.readReady);
      return;
    }
    if (canMarkRead && value >= SWIPE_PEEK) {
      setActiveSide('read');
      setHint(hints.almost);
      return;
    }
    if (canMarkRead && value > 16) {
      setActiveSide('read');
      setHint(hints.cancel);
      return;
    }
    setActiveSide(null);
    setHint(null);
  };

  const shouldCommit = (offset: number, velocity: number, direction: 'left' | 'right') => {
    const signed = direction === 'left' ? -offset : offset;
    const speed = direction === 'left' ? -velocity : velocity;
    if (signed >= SWIPE_COMMIT_OFFSET) return true;
    if (signed >= SWIPE_COMMIT_MIN_OFFSET && speed >= SWIPE_COMMIT_VELOCITY) return true;
    return false;
  };

  const handleDragStart = () => {
    draggedRef.current = true;
  };

  const handleDrag = () => {
    updateHintFromX(x.get());
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (disabled || leaving) return;

    if (shouldCommit(info.offset.x, info.velocity.x, 'left')) {
      if (deleteStartedRef.current) return;
      deleteStartedRef.current = true;
      setLeaving(true);
      setHint(null);
      setActiveSide(null);
      window.setTimeout(() => {
        onDelete();
      }, 220);
      return;
    }

    if (canMarkRead && onMarkRead && shouldCommit(info.offset.x, info.velocity.x, 'right')) {
      onMarkRead();
    }

    // Eşik altındaysa bırakmak = iptal (kart yerine döner)
    setHint(null);
    setActiveSide(null);
    window.setTimeout(() => {
      draggedRef.current = false;
    }, 40);
  };

  return (
    <motion.li
      layout
      initial={false}
      animate={
        leaving
          ? { opacity: 0, height: 0, marginTop: 0, marginBottom: 0, scale: 0.98 }
          : { opacity: 1, height: 'auto', scale: 1 }
      }
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-xl"
      style={{ pointerEvents: leaving ? 'none' : undefined }}
    >
      {!leaving ? (
        <>
          <motion.div
            className="pointer-events-none absolute inset-0 flex items-center justify-start gap-2 bg-[#3B7FED] px-5"
            style={{ opacity: readReveal }}
            aria-hidden
          >
            <FiEye className="h-5 w-5 shrink-0 text-white" />
            {activeSide === 'read' && hint ? (
              <span className="text-xs font-semibold text-white">{hint}</span>
            ) : null}
          </motion.div>
          <motion.div
            className="pointer-events-none absolute inset-0 flex items-center justify-end gap-2 bg-rose-500 px-5"
            style={{ opacity: deleteReveal }}
            aria-hidden
          >
            {activeSide === 'delete' && hint ? (
              <span className="text-xs font-semibold text-white">{hint}</span>
            ) : null}
            <FiTrash2 className="h-5 w-5 shrink-0 text-white" />
          </motion.div>
        </>
      ) : null}
      <motion.div
        style={{ x }}
        drag={disabled || leaving ? false : 'x'}
        dragConstraints={canMarkRead ? { left: -180, right: 180 } : { left: -180, right: 0 }}
        dragElastic={0.04}
        dragSnapToOrigin={!leaving}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        className="relative touch-pan-y"
        onPointerDownCapture={() => {
          draggedRef.current = false;
        }}
        onClickCapture={(event) => {
          if (!draggedRef.current) return;
          event.preventDefault();
          event.stopPropagation();
          const target = event.currentTarget.querySelector<HTMLElement>('a, button');
          if (target) target.dataset.swiped = '1';
          draggedRef.current = false;
        }}
      >
        {children}
      </motion.div>
    </motion.li>
  );
}

export function PersonnelNotificationsBell({ tone = 'light', panelOpen: panelOpenProp, className = '' }: Props) {
  const strings = useRegistryStrings('components/personnel/PersonnelNotificationsBell');
  const { locale } = useLocale();
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
  const [soundPickerOpen, setSoundPickerOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundId, setSoundId] = useState<NotificationSoundId>('default');

  useEffect(() => {
    setMounted(true);
    setMuted(isNotificationsMuted());
    setSoundEnabled(isNotificationSoundEnabled());
    setSoundId(getNotificationSoundId());
  }, []);

  useEffect(() => {
    if (!panelOpen || !settingsOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (soundPickerOpen) {
        setSoundPickerOpen(false);
        return;
      }
      setSettingsOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [panelOpen, settingsOpen, soundPickerOpen]);

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
      setSoundPickerOpen(false);
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

  const handleDelete = async (id: string) => {
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

  const soundLabel = (id: NotificationSoundId) => {
    switch (id) {
      case 'default':
        return strings.settingsSoundDefault;
      case 'classic':
        return strings.settingsSoundClassic;
      case 'ping':
        return strings.settingsSoundPing;
      case 'chime':
        return strings.settingsSoundChime;
      case 'soft':
        return strings.settingsSoundSoft;
      case 'alert':
        return strings.settingsSoundAlert;
      case 'pop':
        return strings.settingsSoundPop;
      case 'bell':
        return strings.settingsSoundBell;
      default:
        return id;
    }
  };

  const selectSound = (id: NotificationSoundId) => {
    setSoundId(id);
    setNotificationSoundId(id);
    playInAppNotificationSound({ force: true, soundId: id });
  };

  const renderNotificationRow = (item: (typeof items)[number]) => {
    const unread = !item.read_at;
    const copy = resolvePersonnelNotificationCopy(locale, item);
    const rowClass = `relative z-[1] flex w-full items-start gap-2.5 rounded-xl border px-2.5 py-2.5 text-left ${
      unread
        ? 'border-slate-200 bg-white shadow-sm shadow-slate-900/[0.05] dark:border-slate-600 dark:bg-slate-900'
        : 'border-slate-200/90 bg-white shadow-sm shadow-slate-900/[0.04] dark:border-slate-700 dark:bg-slate-900'
    }`;

    return (
      <SwipeNotificationRow
        key={item.id}
        disabled={deletingId === item.id}
        canMarkRead={unread}
        onDelete={() => void handleDelete(item.id)}
        onMarkRead={() => void markRead(item.id)}
        hints={{
          cancel: strings.swipeHintCancel,
          almost: strings.swipeHintAlmost,
          deleteReady: strings.swipeHintDelete,
          readReady: strings.swipeHintRead,
        }}
      >
        {item.href ? (
          <Link
            href={item.href}
            className={rowClass}
            onClick={(event) => {
              const target = event.currentTarget;
              if (target.dataset.swiped === '1') {
                event.preventDefault();
                delete target.dataset.swiped;
                return;
              }
              void handleItemClick(item.id, item.href, item.read_at);
            }}
          >
            <NotificationRowContent
              unread={unread}
              title={copy.title}
              body={sanitizeNotificationBody(copy.body)}
              timeLabel={formatRelativeTime(item.created_at, strings)}
              showChevron
            />
          </Link>
        ) : (
          <button
            type="button"
            className={rowClass}
            onClick={(event) => {
              const target = event.currentTarget;
              if (target.dataset.swiped === '1') {
                delete target.dataset.swiped;
                return;
              }
              void handleItemClick(item.id, null, item.read_at);
            }}
          >
            <NotificationRowContent
              unread={unread}
              title={copy.title}
              body={sanitizeNotificationBody(copy.body)}
              timeLabel={formatRelativeTime(item.created_at, strings)}
            />
          </button>
        )}
      </SwipeNotificationRow>
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
              <div className="flex h-14 items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white/95 px-3 shadow-md shadow-slate-900/[0.06] backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-black/25 sm:px-4">
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
                  <div className="flex shrink-0 items-center gap-0.5 rounded-xl bg-slate-100/80 p-0.5 dark:bg-slate-800/80">
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

          {settingsOpen && canViewNotifications ? (
            <div className="absolute inset-0 z-30 flex items-end justify-center p-3 sm:items-center sm:p-6">
              <button
                type="button"
                className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm"
                aria-label={strings.settingsClose}
                onClick={() => {
                  setSoundPickerOpen(false);
                  setSettingsOpen(false);
                }}
              />
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="personnel-notification-settings-title"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                className="relative max-h-[min(88vh,640px)] w-full max-w-md overflow-y-auto overscroll-contain rounded-3xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-900/20 dark:border-slate-700 dark:bg-slate-900"
                data-allow-scroll
              >
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 pb-3 pt-5 dark:border-slate-800">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8EBF8] text-[#0E1548] dark:bg-white/10 dark:text-white">
                      <FiSettings className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <h2
                        id="personnel-notification-settings-title"
                        className="text-base font-semibold text-[#0E1548] dark:text-white"
                      >
                        {strings.settingsTitle}
                      </h2>
                      <p className="mt-0.5 text-xs leading-snug text-slate-500 dark:text-slate-400">
                        {strings.settingsSubtitle}
                      </p>
                      <p className="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {muted
                          ? strings.settingsStatusMuted
                          : soundEnabled
                            ? strings.settingsStatusSoundOn
                            : strings.settingsStatusSoundOff}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSoundPickerOpen(false);
                      setSettingsOpen(false);
                    }}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-white"
                    aria-label={strings.settingsClose}
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex flex-col gap-1 px-3 py-3">
                  <div className="flex items-center justify-between gap-3 rounded-2xl px-3 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#0E1548] dark:text-white">
                        {strings.settingsMuteLabel}
                      </p>
                      <p className="mt-0.5 text-xs leading-snug text-slate-500 dark:text-slate-400">
                        {strings.settingsMuteHint}
                      </p>
                    </div>
                    <SettingsToggle
                      label={strings.settingsMuteLabel}
                      checked={muted}
                      onChange={(next) => {
                        setMuted(next);
                        setNotificationsMuted(next);
                      }}
                    />
                  </div>

                  <div
                    className={`flex items-center justify-between gap-3 rounded-2xl px-3 py-3 ${
                      muted ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#0E1548] dark:text-white">
                        {strings.settingsSoundLabel}
                      </p>
                      <p className="mt-0.5 text-xs leading-snug text-slate-500 dark:text-slate-400">
                        {strings.settingsSoundHint}
                      </p>
                    </div>
                    <SettingsToggle
                      label={strings.settingsSoundLabel}
                      checked={soundEnabled && !muted}
                      disabled={muted}
                      onChange={(next) => {
                        setSoundEnabled(next);
                        setNotificationSoundEnabled(next);
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    disabled={muted || !soundEnabled}
                    onClick={() => setSoundPickerOpen(true)}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-slate-50 active:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-white/5 dark:active:bg-white/10"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-[#0E1548] dark:text-white">
                        {strings.settingsChangeSoundLabel}
                      </span>
                      <span className="mt-0.5 block truncate text-xs leading-snug text-slate-500 dark:text-slate-400">
                        {soundLabel(soundId)}
                      </span>
                    </span>
                    <FiChevronRight className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
                  </button>

                  {items.length > 0 ? (
                    <>
                      <button
                        type="button"
                        disabled={unreadCount === 0}
                        onClick={() => {
                          void markAllRead();
                          setSettingsOpen(false);
                        }}
                        className="flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-slate-50 active:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45 dark:hover:bg-white/5"
                      >
                        <span className="text-sm font-medium text-[#0E1548] dark:text-white">
                          {strings.markAllRead}
                        </span>
                        <FiEye className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSettingsOpen(false);
                          setClearConfirmOpen(true);
                        }}
                        className="flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-rose-50 active:bg-rose-100 dark:hover:bg-rose-950/40"
                      >
                        <span className="text-sm font-medium text-rose-600 dark:text-rose-400">
                          {strings.clearAll}
                        </span>
                        <FiTrash2 className="h-4 w-4 shrink-0 text-rose-500" aria-hidden />
                      </button>
                    </>
                  ) : null}
                </div>

                <div className="safe-pb flex flex-col gap-2 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => playInAppNotificationSound({ force: true, soundId })}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-[#0E1548] transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white dark:hover:bg-slate-800"
                  >
                    <FiVolume2 className="h-4 w-4" />
                    {strings.settingsTestSound}
                  </button>
                  {isTwaApp ? (
                    <button
                      type="button"
                      onClick={openPersonnelAppNotificationSettings}
                      className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#0E1548] px-4 text-sm font-semibold text-white"
                    >
                      {strings.permissionOpenAppSettingsButton}
                    </button>
                  ) : null}
                </div>
              </motion.div>

              {soundPickerOpen ? (
                <div className="absolute inset-0 z-10 flex items-center justify-center p-5">
                  <button
                    type="button"
                    className="absolute inset-0 bg-slate-900/50"
                    aria-label={strings.settingsClose}
                    onClick={() => setSoundPickerOpen(false)}
                  />
                  <motion.div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="personnel-notification-sound-picker-title"
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                      <div className="min-w-0">
                        <h3
                          id="personnel-notification-sound-picker-title"
                          className="text-base font-semibold text-[#0E1548] dark:text-white"
                        >
                          {strings.settingsSoundPickerTitle}
                        </h3>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {strings.settingsChangeSoundHint}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSoundPickerOpen(false)}
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                        aria-label={strings.settingsClose}
                      >
                        <FiX className="h-5 w-5" />
                      </button>
                    </div>
                    <div
                      className="max-h-[min(55vh,420px)] overflow-y-auto overscroll-contain p-3"
                      data-allow-scroll
                    >
                      <div className="flex flex-col gap-1">
                        {NOTIFICATION_SOUND_OPTIONS.map((option) => {
                          const selected = soundId === option.id;
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => selectSound(option.id)}
                              className={`flex min-h-12 items-center gap-3 rounded-2xl px-3.5 text-left transition active:scale-[0.99] ${
                                selected
                                  ? 'bg-[#3B7FED]/12 text-[#0E1548] dark:bg-sky-400/15 dark:text-white'
                                  : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5'
                              }`}
                            >
                              <span
                                className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                  selected
                                    ? 'bg-[#3B7FED] text-white'
                                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'
                                }`}
                              >
                                <FiVolume2 className="h-4 w-4" />
                              </span>
                              <span className="min-w-0 flex-1 text-sm font-semibold">
                                {soundLabel(option.id)}
                              </span>
                              {selected ? (
                                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#3B7FED]" aria-hidden />
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                </div>
              ) : null}
            </div>
          ) : null}

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

          <div
            className="safe-pb min-h-0 flex-1 overflow-y-auto overscroll-none scrollbar-thin-glass"
            data-allow-scroll
          >
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
                <AnimatePresence initial={false}>
                  {items.map(renderNotificationRow)}
                </AnimatePresence>
              </ul>
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
