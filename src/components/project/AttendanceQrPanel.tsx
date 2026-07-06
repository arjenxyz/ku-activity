'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import dayjs from 'dayjs';
import {
  FiCheckCircle,
  FiClock,
  FiCopy,
  FiPlay,
  FiRefreshCw,
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
import { btnPrimary, labelClass, inputClass } from '@/components/project/ui';

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

function copyText(text: string) {
  void navigator.clipboard?.writeText(text);
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
  const [copied, setCopied] = useState(false);
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
  }, [projectId, date]);

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
    if (!window.confirm(strings.confirm.cancel)) {
      return;
    }
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

  const handleCopyCode = () => {
    if (!data?.qr?.token) return;
    copyText(data.qr.token);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
    <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 px-4 py-5 sm:px-6 sm:py-6 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_55%)]" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-emerald-100/90 text-xs font-medium uppercase tracking-wider">
              {strings.header.eyebrow}
            </p>
            <h2 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight">{strings.header.title}</h2>
            <p className="mt-2 text-sm text-emerald-50/90 max-w-lg leading-relaxed">
              {strings.header.description}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-medium backdrop-blur hover:bg-white/20 disabled:opacity-50 transition-colors"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {strings.header.refresh}
          </button>
        </div>

        <div className="relative mt-5 grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-xl bg-white/10 px-3 py-2.5 backdrop-blur">
            <p className="text-[10px] sm:text-xs text-emerald-100/80 uppercase tracking-wide">
              {strings.stats.date}
            </p>
            <p className="text-sm sm:text-base font-semibold truncate">{formattedDate}</p>
          </div>
          <div className="rounded-xl bg-white/10 px-3 py-2.5 backdrop-blur">
            <p className="text-[10px] sm:text-xs text-emerald-100/80 uppercase tracking-wide">
              {strings.stats.status}
            </p>
            <p className="text-sm sm:text-base font-semibold">
              {loading && !data
                ? strings.stats.loading
                : isActive
                  ? strings.stats.active
                  : isCompleted
                    ? strings.stats.completed
                    : strings.stats.notStarted}
            </p>
          </div>
          <div className="rounded-xl bg-white/10 px-3 py-2.5 backdrop-blur">
            <p className="text-[10px] sm:text-xs text-emerald-100/80 uppercase tracking-wide">
              {strings.stats.checkIns}
            </p>
            <p className="text-sm sm:text-base font-semibold">
              {formatString(strings.stats.checkInCount, { count: checkInCount })}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-5">
        <div className="max-w-xs">
          <label className={labelClass}>{strings.dateLabel}</label>
          <input
            type="date"
            className={inputClass}
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setSuccess(null);
            }}
            disabled={isActive}
          />
        </div>

        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            {error}
          </p>
        )}
        {success && (
          <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
            {success}
          </p>
        )}

        {windowInfo && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              windowOpen
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-amber-200 bg-amber-50 text-amber-900'
            }`}
          >
            <p className="flex items-start gap-2 font-medium">
              <FiClock className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {formatString(strings.workHours, {
                  start: windowInfo.workStartTime,
                  end: windowInfo.workEndTime,
                  timezone: windowInfo.timezone,
                })}
              </span>
            </p>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed opacity-90">
              {windowInfo.message}
            </p>
            <p className="mt-1 text-xs opacity-80">
              {formatString(strings.windowRange, {
                start: windowInfo.windowStartLabel,
                end: windowInfo.windowEndLabel,
              })}
            </p>
          </div>
        )}

        {loading && !data ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="h-72 rounded-2xl bg-slate-100 animate-pulse" />
            <div className="h-72 rounded-2xl bg-slate-100 animate-pulse" />
          </div>
        ) : isActive && data?.qr ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,280px)_1fr]">
            <div className="flex flex-col items-center">
              <div className="relative w-full max-w-[300px]">
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-emerald-400/30 to-teal-500/20 blur-sm" />
                <div className="relative rounded-2xl border-2 border-emerald-200 bg-white p-4 shadow-md">
                  <span className="mb-3 flex items-center justify-center gap-2 text-xs font-semibold text-emerald-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    {strings.nextScan}
                  </span>
                  <RegistrationQrCode value={data.qr.url} size={240} />
                </div>
              </div>

              <div className="mt-4 w-full max-w-[300px] space-y-2">
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <code className="flex-1 text-xs font-mono font-semibold text-slate-700 truncate">
                    {data.qr.token}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-white hover:text-emerald-600 transition-colors"
                    title={strings.copyCodeTitle}
                  >
                    <FiCopy className="w-4 h-4" />
                  </button>
                </div>
                {copied && (
                  <p className="text-xs text-center text-emerald-600 font-medium">{strings.copied}</p>
                )}
                <p className="text-xs text-center text-slate-500 leading-relaxed">{strings.qrHint}</p>
              </div>
            </div>

            <div className="flex min-w-0 flex-col">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FiUsers className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base font-semibold text-slate-900">
                    {strings.checkInsTitle}
                    <span className="ml-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-emerald-100 px-2 text-xs font-bold text-emerald-800">
                      {checkInCount}
                    </span>
                  </h3>
                </div>
              </div>

              {checkInCount === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-12 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <FiUsers className="w-7 h-7" />
                  </div>
                  <p className="mt-4 text-sm font-medium text-slate-700">{strings.emptyCheckInsTitle}</p>
                  <p className="mt-1 text-xs text-slate-500">{strings.emptyCheckInsHint}</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm max-h-[min(420px,50vh)] overflow-y-auto">
                  {data.checkIns.map((c, i) => (
                    <li key={c.id}>
                      <div className="flex items-center gap-2 px-3 py-3 sm:px-4 hover:bg-slate-50/80 transition-colors">
                        <button
                          type="button"
                          onClick={() => setEditingCheckIn(c)}
                          className="flex min-w-0 flex-1 items-center gap-3 text-left"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
                            {initials(c.employee_name) || String(i + 1)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {c.employee_name}
                            </p>
                            <p className="text-xs text-slate-500">{formatDateTime(c.created_at)}</p>
                            <p className="mt-1 text-xs font-medium text-emerald-700">
                              {formatWorkLogSummary(
                                Number(c.planned_amount ?? 1),
                                (c.planned_mesai_type ?? 'none') as MesaiType
                              )}
                            </p>
                          </span>
                          <span className="shrink-0 text-[11px] font-semibold text-slate-400">
                            {strings.editPlan}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleRemoveCheckIn(c.id, c.employee_name)}
                          disabled={removingId === c.id || acting}
                          className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40 transition-colors"
                          title={strings.removeFromListTitle}
                          aria-label={formatString(strings.removeAriaLabel, { name: c.employee_name })}
                        >
                          <FiUserMinus className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4 hidden sm:flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void handleComplete()}
                  disabled={acting || !checkInCount}
                  className={`${btnPrimary} inline-flex items-center gap-2`}
                >
                  <FiCheckCircle className="w-4 h-4" />
                  {acting ? strings.completeSaving : strings.complete}
                </button>
                <button
                  type="button"
                  onClick={() => void handleCancel()}
                  disabled={acting}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  <FiXCircle className="w-4 h-4" />
                  {strings.cancelSession}
                </button>
              </div>
            </div>
          </div>
        ) : isCompleted && data?.session ? (
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/50 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                <FiCheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-base font-semibold text-emerald-900">{strings.completedTitle}</p>
                {data.session.completed_at && (
                  <p className="text-sm text-emerald-700 mt-0.5">
                    {formatDateTime(data.session.completed_at)}
                  </p>
                )}
                <p className="text-sm text-emerald-800 mt-2">
                  {formatString(strings.completedSummary, { count: checkInCount })}
                </p>
              </div>
            </div>

            {checkInCount > 0 && (
              <ul className="mt-5 divide-y divide-emerald-100 overflow-hidden rounded-xl border border-emerald-100 bg-white">
                {data.checkIns.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                  >
                    <div className="min-w-0">
                      <span className="font-medium text-slate-800">{c.employee_name}</span>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        {formatWorkLogSummary(
                          Number(c.planned_amount ?? 1),
                          (c.planned_mesai_type ?? 'none') as MesaiType
                        )}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 shrink-0">
                      <FiCheckCircle className="w-3.5 h-3.5" />
                      {strings.workLogWritten}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {data.canStart && (
              <button
                type="button"
                onClick={() => void handleStart()}
                disabled={acting}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                <FiPlay className="w-4 h-4" />
                {strings.restart}
              </button>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 sm:py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-100">
              <FiPlay className="w-8 h-8 text-emerald-600" />
            </div>
            <p className="mt-5 text-base font-semibold text-slate-800">
              {formatString(strings.noSessionTitle, { date: formattedDate })}
            </p>
            <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
              {windowOpen ? strings.noSessionOpenHint : strings.noSessionClosedHint}
            </p>
            <button
              type="button"
              onClick={() => void handleStart()}
              disabled={acting || !windowOpen}
              className={`${btnPrimary} mt-6 inline-flex items-center gap-2 px-6 py-3 text-base disabled:opacity-50`}
            >
              <FiPlay className="w-5 h-5" />
              {acting ? strings.startSaving : strings.start}
            </button>
          </div>
        )}
      </div>

      {isActive && data?.qr && (
        <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] inset-x-0 z-30 sm:hidden px-4 pb-2">
          <div className="flex gap-2 rounded-2xl bg-white/95 p-2 shadow-xl ring-1 ring-slate-200/80 backdrop-blur">
            <button
              type="button"
              onClick={() => void handleCancel()}
              disabled={acting}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-red-200 text-red-600 disabled:opacity-50"
              aria-label={strings.cancelAriaLabel}
            >
              <FiTrash2 className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => void handleComplete()}
              disabled={acting || !checkInCount}
              className={`${btnPrimary} flex-1 flex items-center justify-center gap-2 py-3 text-base`}
            >
              <FiCheckCircle className="w-5 h-5" />
              {acting
                ? strings.completeSaving
                : formatString(strings.finishMobile, { count: checkInCount })}
            </button>
          </div>
        </div>
      )}
    </section>

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
