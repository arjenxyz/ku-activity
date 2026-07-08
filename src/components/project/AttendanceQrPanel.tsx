'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import dayjs from 'dayjs';
import {
  FiCheckCircle,
  FiClock,
  FiPlay,
  FiTrash2,
  FiUserMinus,
  FiUsers,
  FiXCircle,
} from 'react-icons/fi';
import { RegistrationQrCode } from '@/components/registration/RegistrationQrCode';
import { AdminAttendanceModal } from '@/components/admin/AdminAttendanceModal';
import { formatDateTime } from '@/lib/format';
import { formatString } from '@/lib/strings/format';
import { formatWorkLogSummary, type MesaiType } from '@/lib/work-log';
import {
  cancelAttendanceSession,
  completeAttendanceSession,
  fetchAttendanceQr,
  removeAttendanceCheckIn,
  startAttendanceSession,
  updateAttendanceCheckInPlan,
  type AttendanceQrPayload,
} from '@/lib/project-api';

type Props = {
  projectId: string;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

function statusLabel(
  strings: {
    stats: { loading: string; active: string; completed: string; notStarted: string };
  },
  loading: boolean,
  data: AttendanceQrPayload | null
) {
  if (loading && !data) return strings.stats.loading;
  if (data?.session?.status === 'active') return strings.stats.active;
  if (data?.session?.status === 'completed') return strings.stats.completed;
  return strings.stats.notStarted;
}

export function AttendanceQrPanel({ projectId }: Props) {
  const strings = useRegistryStrings('components/project/AttendanceQrPanel');
  const [date, setDate] = useState('');
  const [data, setData] = useState<AttendanceQrPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingCheckIn, setEditingCheckIn] = useState<AttendanceQrPayload['checkIns'][number] | null>(
    null
  );
  const [savingPlan, setSavingPlan] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchAttendanceQr(projectId, date || undefined);
      const resolvedDate =
        payload.window?.currentOpenWorkDate ?? payload.window?.workDate ?? date;
      if (resolvedDate && resolvedDate !== date) {
        setDate(resolvedDate);
      }
      setData(payload);
    } catch (e) {
      setError(e instanceof Error ? e.message : strings.errors.loadFailed);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [projectId, date, strings.errors.loadFailed]);

  useEffect(() => {
    void load();
  }, [load]);

  const isActive = data?.session?.status === 'active';
  const isCompleted = data?.session?.status === 'completed';
  const activeToken = data?.qr?.token;
  const checkInCount = data?.checkIns.length ?? 0;
  const windowInfo = data?.window;
  const windowOpen = windowInfo?.isOpen ?? false;
  const formattedDate = date
    ? dayjs(date).format('DD MMMM YYYY')
    : dayjs().format('DD MMMM YYYY');

  useEffect(() => {
    if (!isActive || !activeToken) return;
    const timer = window.setInterval(() => void load(), 4000);
    return () => window.clearInterval(timer);
  }, [isActive, activeToken, load]);

  const handleStart = async () => {
    setActing(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = await startAttendanceSession(projectId, date);
      setData(payload);
    } catch (e) {
      setError(e instanceof Error ? e.message : strings.errors.startFailed);
    } finally {
      setActing(false);
    }
  };

  const handleComplete = async () => {
    if (!data?.checkIns.length) {
      setError(strings.errors.emptyList);
      return;
    }
    if (!window.confirm(formatString(strings.confirm.complete, { count: data.checkIns.length }))) {
      return;
    }
    setActing(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = await completeAttendanceSession(projectId, date);
      setData(payload);
      setSuccess(payload.message ?? strings.success.completed);
    } catch (e) {
      setError(e instanceof Error ? e.message : strings.errors.completeFailed);
    } finally {
      setActing(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm(strings.confirm.cancel)) return;
    setActing(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = await cancelAttendanceSession(projectId, date);
      setData(payload);
      setSuccess(payload.message ?? strings.success.cancelled);
    } catch (e) {
      setError(e instanceof Error ? e.message : strings.errors.cancelFailed);
    } finally {
      setActing(false);
    }
  };

  const handleRemoveCheckIn = async (checkInId: string, name: string) => {
    if (!window.confirm(formatString(strings.confirm.removeCheckIn, { name }))) return;
    setRemovingId(checkInId);
    setError(null);
    try {
      await removeAttendanceCheckIn(projectId, checkInId);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : strings.errors.removeFailed);
    } finally {
      setRemovingId(null);
    }
  };

  const handleSaveCheckInPlan = async (payload: {
    amount: number;
    mesaiType: MesaiType;
    description: string;
  }) => {
    if (!editingCheckIn) return;
    setSavingPlan(true);
    setError(null);
    try {
      await updateAttendanceCheckInPlan(projectId, editingCheckIn.id, {
        amount: payload.amount,
        mesaiType: payload.mesaiType,
        description: payload.description,
      });
      setEditingCheckIn(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : strings.errors.planSaveFailed);
    } finally {
      setSavingPlan(false);
    }
  };

  const cardClass =
    'rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-sm backdrop-blur sm:p-5 dark:border-slate-700 dark:bg-slate-900/90';
  const primaryBtn =
    'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50';
  const secondaryBtn =
    'inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50';

  return (
    <>
      <div className="space-y-4 pb-24 sm:pb-4">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0b1324] via-[#0f1f34] to-[#102941] p-5 text-white shadow-[0_20px_50px_rgba(6,17,33,0.35)]">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                'radial-gradient(circle at 15% 20%, rgba(16,185,129,0.35) 0%, transparent 35%), radial-gradient(circle at 82% 10%, rgba(59,130,246,0.28) 0%, transparent 40%)',
            }}
          />
          <div className="flex items-center gap-3">
            <span className="relative z-[1] flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur">
              <FiUsers className="h-5 w-5" />
            </span>
            <div className="relative z-[1] min-w-0 flex-1">
              <h1 className="text-xl font-bold leading-tight">{strings.header.title}</h1>
              <p className="mt-0.5 text-sm text-white/75">{strings.header.subtitle}</p>
            </div>
          </div>
          <div className="relative z-[1] mt-4 flex flex-wrap gap-2 text-xs font-medium">
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 backdrop-blur">
              {formattedDate}
            </span>
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 backdrop-blur">
              {statusLabel(strings, loading, data)}
            </span>
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 backdrop-blur">
              {formatString(strings.stats.checkInCount, { count: checkInCount })}
            </span>
          </div>
        </div>

        <div className={cardClass}>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">{strings.dateLabel}</label>
          <input
            type="date"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-2 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setSuccess(null);
            }}
            disabled={isActive}
          />
        </div>

        {windowInfo && !windowOpen && !isActive && (
          <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <FiClock className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{windowInfo.message}</p>
          </div>
        )}

        {error && (
          <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}
        {success && (
          <p className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <FiCheckCircle className="h-4 w-4 shrink-0" />
            {success}
          </p>
        )}

        {loading && !data ? (
          <div className={`${cardClass} flex items-center justify-center py-16`}>
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          </div>
        ) : isActive && data?.qr ? (
          <>
            <div className={`${cardClass} overflow-hidden !p-0`}>
              <div className="bg-[#0b1626] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-emerald-300">
                {strings.nextScan}
              </div>
              <div className="relative flex flex-col items-center px-4 py-5">
                <div
                  className="pointer-events-none absolute inset-0 opacity-30"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle at 50% 10%, rgba(16,185,129,0.2) 0%, transparent 45%)',
                  }}
                />
                <div className="relative rounded-2xl border border-emerald-100 bg-white p-3 shadow-sm">
                  <RegistrationQrCode value={data.qr.url} size={220} />
                </div>
                <p className="relative mt-3 text-center text-xs text-slate-500">{strings.qrHint}</p>
              </div>
            </div>

            <div className={cardClass}>
              <h2 className="mb-3 text-sm font-semibold text-slate-900">{strings.checkInsTitle}</h2>

              {checkInCount === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">{strings.emptyCheckInsHint}</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {data.checkIns.map((c, i) => (
                    <li key={c.id} className="flex items-center gap-2 py-3 first:pt-0 last:pb-0">
                      <button
                        type="button"
                        onClick={() => setEditingCheckIn(c)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
                          {initials(c.employee_name) || String(i + 1)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-900">{c.employee_name}</p>
                          <p className="text-xs text-slate-500">{formatDateTime(c.created_at)}</p>
                          <p className="mt-0.5 text-xs font-medium text-emerald-700">
                            {formatWorkLogSummary(
                              Number(c.planned_amount ?? 1),
                              (c.planned_mesai_type ?? 'none') as MesaiType
                            )}
                          </p>
                        </span>
                        <span className="shrink-0 text-xs font-semibold text-emerald-600">
                          {strings.editPlan}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleRemoveCheckIn(c.id, c.employee_name)}
                        disabled={removingId === c.id || acting}
                        className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                        title={strings.removeFromListTitle}
                        aria-label={formatString(strings.removeAriaLabel, { name: c.employee_name })}
                      >
                        <FiUserMinus className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4 hidden gap-2 sm:flex">
                <button
                  type="button"
                  onClick={() => void handleComplete()}
                  disabled={acting || !checkInCount}
                  className={primaryBtn}
                >
                  <FiCheckCircle className="h-4 w-4" />
                  {acting ? strings.completeSaving : strings.complete}
                </button>
                <button
                  type="button"
                  onClick={() => void handleCancel()}
                  disabled={acting}
                  className={`${secondaryBtn} border-red-200 text-red-700 hover:bg-red-50`}
                >
                  <FiXCircle className="h-4 w-4" />
                  {strings.cancelSession}
                </button>
              </div>
            </div>
          </>
        ) : isCompleted && data?.session ? (
          <div className={cardClass}>
            <div className="flex items-start gap-3">
              <FiCheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <div>
                <p className="font-semibold text-slate-900">{strings.completedTitle}</p>
                {data.session.completed_at && (
                  <p className="mt-0.5 text-sm text-slate-500">{formatDateTime(data.session.completed_at)}</p>
                )}
                <p className="mt-1 text-sm text-slate-600">
                  {formatString(strings.completedSummary, { count: checkInCount })}
                </p>
              </div>
            </div>

            {checkInCount > 0 && (
              <ul className="mt-4 divide-y divide-slate-100 border-t border-slate-100 pt-2">
                {data.checkIns.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <div className="min-w-0">
                      <span className="font-medium text-slate-800">{c.employee_name}</span>
                      <p className="text-xs text-emerald-700">
                        {formatWorkLogSummary(
                          Number(c.planned_amount ?? 1),
                          (c.planned_mesai_type ?? 'none') as MesaiType
                        )}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-emerald-600">{strings.workLogWritten}</span>
                  </li>
                ))}
              </ul>
            )}

            {data.canStart && (
              <button
                type="button"
                onClick={() => void handleStart()}
                disabled={acting}
                className={`${primaryBtn} mt-4`}
              >
                <FiPlay className="h-4 w-4" />
                {strings.restart}
              </button>
            )}
          </div>
        ) : (
          <div className={`${cardClass} text-center`}>
            <p className="font-medium text-slate-800">
              {formatString(strings.noSessionTitle, { date: formattedDate })}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {windowOpen ? strings.noSessionOpenHint : strings.noSessionClosedHint}
            </p>
            <button
              type="button"
              onClick={() => void handleStart()}
              disabled={acting || !windowOpen}
              className={`${primaryBtn} mt-5`}
            >
              <FiPlay className="h-4 w-4" />
              {acting ? strings.startSaving : strings.start}
            </button>
          </div>
        )}
      </div>

      {isActive && data?.qr && (
        <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 px-4 pb-2 sm:hidden">
          <div className="flex gap-2 rounded-2xl border border-slate-200/80 bg-white/95 p-2 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
            <button
              type="button"
              onClick={() => void handleCancel()}
              disabled={acting}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-red-200 text-red-600 disabled:opacity-50"
              aria-label={strings.cancelAriaLabel}
            >
              <FiTrash2 className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => void handleComplete()}
              disabled={acting || !checkInCount}
              className={`${primaryBtn} flex-1 py-3`}
            >
              <FiCheckCircle className="h-5 w-5" />
              {acting
                ? strings.completeSaving
                : formatString(strings.finishMobile, { count: checkInCount })}
            </button>
          </div>
        </div>
      )}

      <AdminAttendanceModal
        employeeName={editingCheckIn?.employee_name ?? ''}
        isOpen={Boolean(editingCheckIn)}
        loading={savingPlan}
        initialAmount={Number(editingCheckIn?.planned_amount ?? 1)}
        initialMesaiType={(editingCheckIn?.planned_mesai_type ?? 'none') as MesaiType}
        initialDescription={editingCheckIn?.planned_description ?? ''}
        hint={strings.checkInPlanHint}
        submitLabel={strings.checkInPlanSave}
        onClose={() => setEditingCheckIn(null)}
        onSubmit={(payload) => void handleSaveCheckInPlan(payload)}
      />
    </>
  );
}
