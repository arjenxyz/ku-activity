'use client';


import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FiCheckCircle, FiHash, FiMonitor, FiX } from 'react-icons/fi';
import { AttendanceCodeSheet } from '@/components/personnel/AttendanceCodeSheet';
import { AttendanceQrScanner } from '@/components/personnel/AttendanceQrScanner';
import { AttendanceWindowCountdown } from '@/components/personnel/AttendanceWindowCountdown';
import {
  AttendanceScanErrorOverlay,
  AttendanceStatusSticker,
} from '@/components/personnel/AttendanceStatusSticker';
import { useRegisterPersonnelTopBarEnterCode } from '@/contexts/PersonnelTopBarActionsContext';
import { parseAttendanceTokenFromQr } from '@/lib/parse-attendance-qr';
import {
  fetchPersonnelAttendanceStatus,
  scanAttendanceQr,
  type PersonnelAttendanceStatusPayload,
} from '@/lib/personnel-api';

function YoklamaContent() {
  const strings = useRegistryStrings('app/personnel-panel/yoklama/page');
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('t') ?? searchParams.get('token') ?? '';

  const [status, setStatus] = useState<PersonnelAttendanceStatusPayload | null>(null);
  const [scanning, setScanning] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [manualCode, setManualCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [codeSheetOpen, setCodeSheetOpen] = useState(false);
  const [autoScanned, setAutoScanned] = useState(false);
  const [forceReplace, setForceReplace] = useState(false);

  const refreshStatus = useCallback(async () => {
    try {
      const s = await fetchPersonnelAttendanceStatus();
      setStatus(s);
      setError((prev) => (prev === strings.statusLoadFailed ? null : prev));
      return s;
    } catch {
      setError(strings.statusLoadFailed);
      return null;
    }
  }, [strings.statusLoadFailed]);

  useEffect(() => {
    void (async () => {
      setLoadingStatus(true);
      await refreshStatus();
      setLoadingStatus(false);
    })();
  }, [refreshStatus]);

  useEffect(() => {
    if (status?.state !== 'waiting' && status?.state !== 'removed') return;
    const timer = window.setInterval(() => void refreshStatus(), 4000);
    return () => window.clearInterval(timer);
  }, [status?.state, refreshStatus]);

  const shouldReplace = useCallback(
    (s: PersonnelAttendanceStatusPayload | null) =>
      forceReplace || s?.state === 'cancelled' || s?.state === 'removed',
    [forceReplace]
  );

  const submitToken = useCallback(
    async (raw: string) => {
      const token = parseAttendanceTokenFromQr(raw);
      if (!token) {
        setError(strings.invalidQrMessage);
        return;
      }
      setScanning(true);
      setError(null);
      setSuccessMsg(null);
      const replace = shouldReplace(status);
      try {
        const result = await scanAttendanceQr(token, { replace });
        if (result.status) {
          setStatus(result.status);
        } else {
          await refreshStatus();
        }
        setCodeSheetOpen(false);
        setForceReplace(false);
        setSuccessMsg(replace ? strings.rescanSuccess : strings.scanSuccess);
        window.setTimeout(() => setSuccessMsg(null), 3500);
      } catch (e) {
        setError(e instanceof Error ? e.message : strings.scanFailed);
      } finally {
        setScanning(false);
      }
    },
    [status, shouldReplace, refreshStatus, strings]
  );

  useEffect(() => {
    if (tokenFromUrl && !autoScanned && !scanning && !loadingStatus) {
      setAutoScanned(true);
      void submitToken(tokenFromUrl);
    }
  }, [tokenFromUrl, autoScanned, scanning, loadingStatus, submitToken]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submitToken(manualCode);
  };

  const windowClosed = Boolean(status?.window && !status.window.isOpen && status.state === 'none');
  const attendanceWindow = status?.window ?? null;
  const showWindowCountdown = Boolean(attendanceWindow) && status?.state === 'none';
  const windowCountdownTarget = attendanceWindow
    ? attendanceWindow.isOpen
      ? attendanceWindow.windowEnd
      : attendanceWindow.windowStart
    : null;
  const failureBlocked =
    !forceReplace && (status?.state === 'cancelled' || status?.state === 'removed');
  const showScanner = !loadingStatus && !failureBlocked;
  const scanPaused =
    scanning ||
    windowClosed ||
    (!forceReplace &&
      (status?.state === 'waiting' ||
        status?.state === 'completed' ||
        status?.state === 'did_not_work' ||
        status?.state === 'cancelled' ||
        status?.state === 'removed'));

  const openCodeSheet = useCallback(() => {
    setError(null);
    setCodeSheetOpen(true);
  }, []);

  const closeCodeSheet = useCallback(() => {
    setCodeSheetOpen(false);
    setError(null);
  }, []);

  const enterCodeDisabled =
    !codeSheetOpen &&
    scanPaused &&
    !forceReplace &&
    status?.state !== 'cancelled' &&
    status?.state !== 'removed';

  const topBarEnterCode = useMemo(
    () =>
      codeSheetOpen
        ? {
            label: strings.cancelCodeButton,
            variant: 'cancel' as const,
            onClick: closeCodeSheet,
          }
        : {
            label: strings.enterCodeButton,
            variant: 'enter' as const,
            disabled: enterCodeDisabled,
            onClick: openCodeSheet,
          },
    [
      codeSheetOpen,
      strings.cancelCodeButton,
      strings.enterCodeButton,
      enterCodeDisabled,
      closeCodeSheet,
      openCodeSheet,
    ]
  );

  useRegisterPersonnelTopBarEnterCode(topBarEnterCode);

  return (
    <>
      {/* Mobil — tam ekran kamera, alt bar yok */}
      <div className="fixed inset-x-0 bottom-0 personnel-topbar-top z-0 bg-black sm:hidden">
        {!loadingStatus && !showScanner && failureBlocked && (
          <div className="absolute inset-0 bg-[#060d14]" aria-hidden />
        )}

        {showScanner ? (
          <AttendanceQrScanner
            key={forceReplace ? 'rescan' : 'scan'}
            className="absolute inset-0 h-full w-full"
            onScan={(t) => void submitToken(t)}
            disabled={scanPaused}
            paused={scanPaused}
            parseQr={parseAttendanceTokenFromQr}
            invalidQrMessage={strings.invalidQrMessage}
          />
        ) : loadingStatus ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
          </div>
        ) : null}

        {status && (
          <AttendanceStatusSticker
            status={status}
            forceReplace={forceReplace}
            onForceReplace={() => {
              setForceReplace(true);
              setError(null);
            }}
          />
        )}

        {forceReplace &&
          (status?.state === 'waiting' ||
            status?.state === 'completed' ||
            status?.state === 'cancelled' ||
            status?.state === 'removed') && (
          <div className="absolute inset-x-4 top-4 z-[7] flex items-center gap-3 rounded-2xl border border-amber-200/20 bg-[#0f1a28]/95 px-3.5 py-2.5 text-xs text-amber-50 shadow-lg backdrop-blur-md">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
            </span>
            <p className="min-w-0 flex-1 font-medium">
              {status?.state === 'cancelled' || status?.state === 'removed'
                ? strings.rescanModeNewQr
                : strings.rescanModeReplace}
            </p>
            <button
              type="button"
              onClick={() => setForceReplace(false)}
              className="shrink-0 rounded-lg p-1.5 text-amber-100/80 transition hover:bg-white/10 hover:text-white"
              aria-label={strings.cancelRescanAriaLabel}
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>
        )}

        {showWindowCountdown && windowCountdownTarget && (
          <AttendanceWindowCountdown
            targetIso={windowCountdownTarget}
            isOpen={Boolean(attendanceWindow?.isOpen)}
            variant="overlay"
            onElapsed={() => void refreshStatus()}
          />
        )}

        {successMsg && status?.state === 'none' && (
          <div className="fixed inset-x-4 bottom-nav z-[5] flex items-center justify-center gap-2 rounded-xl bg-emerald-600/95 px-4 py-3 text-sm font-medium text-white shadow-lg">
            <FiCheckCircle className="h-4 w-4 shrink-0" />
            {successMsg}
          </div>
        )}

        {error &&
          !codeSheetOpen &&
          !successMsg &&
          (forceReplace ||
            !status ||
            status.state === 'none' ||
            status.state === 'did_not_work' ||
            status.state === 'cancelled' ||
            status.state === 'removed') && (
            <AttendanceScanErrorOverlay message={error} onDismiss={() => setError(null)} />
          )}
      </div>

      {/* Masaüstü — yalnızca manuel kod */}
      <div className="mx-auto hidden max-w-lg sm:block">
        <DesktopManualPanel
          status={status}
          loading={loadingStatus}
          scanning={scanning}
          manualCode={manualCode}
          setManualCode={setManualCode}
          error={error}
          successMsg={successMsg}
          windowClosed={windowClosed}
          forceReplace={forceReplace}
          onForceReplace={() => {
            setForceReplace(true);
            setError(null);
          }}
          onCancelReplace={() => setForceReplace(false)}
          onManualSubmit={handleManualSubmit}
          onWindowElapsed={() => void refreshStatus()}
        />
      </div>

      <AttendanceCodeSheet
        open={codeSheetOpen}
        onClose={() => setCodeSheetOpen(false)}
        code={manualCode}
        onCodeChange={setManualCode}
        onSubmit={handleManualSubmit}
        submitting={scanning}
        disabled={windowClosed}
        isRescan={forceReplace || status?.state === 'cancelled' || status?.state === 'removed'}
        error={codeSheetOpen ? error : null}
      />
    </>
  );
}

function DesktopManualPanel({
  status,
  loading,
  scanning,
  manualCode,
  setManualCode,
  error,
  successMsg,
  windowClosed,
  forceReplace,
  onForceReplace,
  onCancelReplace,
  onManualSubmit,
  onWindowElapsed,
}: {
  status: PersonnelAttendanceStatusPayload | null;
  loading: boolean;
  scanning: boolean;
  manualCode: string;
  setManualCode: (v: string) => void;
  error: string | null;
  successMsg: string | null;
  windowClosed: boolean;
  forceReplace: boolean;
  onForceReplace: () => void;
  onCancelReplace: () => void;
  onManualSubmit: (e: React.FormEvent) => void;
  onWindowElapsed: () => void;
}) {
  const strings = useRegistryStrings('app/personnel-panel/yoklama/page');
  const formDisabled = scanning || windowClosed || loading;

  return (
    <div className="mt-4 space-y-4">
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-5 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
            <FiHash className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-bold leading-tight">{strings.desktop.title}</h1>
            <p className="mt-0.5 text-sm text-emerald-50/90">{strings.desktop.subtitle}</p>
          </div>
        </div>
      </div>

      {status && status.state !== 'none' && (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="font-medium text-slate-900 dark:text-white">{status.message}</p>
          {(status.state === 'waiting' || status.state === 'completed') && !forceReplace && (
            <button
              type="button"
              onClick={onForceReplace}
              className="mt-2 text-xs font-semibold text-emerald-600 underline dark:text-emerald-400"
            >
              {strings.desktop.rescanButton}
            </button>
          )}
          {forceReplace && (
            <button
              type="button"
              onClick={onCancelReplace}
              className="mt-2 text-xs font-semibold text-amber-600 underline"
            >
              {strings.desktop.cancelRescanButton}
            </button>
          )}
        </div>
      )}

      {status?.window && status.state === 'none' && (
        <AttendanceWindowCountdown
          targetIso={status.window.isOpen ? status.window.windowEnd : status.window.windowStart}
          isOpen={status.window.isOpen}
          variant="panel"
          onElapsed={onWindowElapsed}
        />
      )}

      <form
        onSubmit={onManualSubmit}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <input
          id="desktop-attendance-code"
          type="text"
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value.toUpperCase())}
          placeholder={strings.desktop.codePlaceholder}
          disabled={formDisabled}
          autoComplete="off"
          spellCheck={false}
          aria-label={strings.desktop.codeLabel}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-center font-mono text-lg uppercase tracking-[0.15em] text-slate-900 outline-none ring-emerald-500/30 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        <button
          type="submit"
          disabled={formDisabled || !manualCode.trim()}
          className="w-full rounded-xl bg-emerald-600 py-3.5 font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {scanning ? strings.desktop.submitScanning : forceReplace ? strings.desktop.submitRescan : strings.desktop.submitJoin}
        </button>
        <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
          <FiMonitor className="h-3.5 w-3.5 shrink-0" />
          {strings.desktop.qrNotSupportedShort}
        </p>
      </form>

      {successMsg && (
        <p className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          <FiCheckCircle className="h-4 w-4 shrink-0" />
          {successMsg}
        </p>
      )}
      {error && (
        <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </p>
      )}
    </div>
  );
}

export default function YoklamaPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 flex items-center justify-center bg-black sm:bg-transparent">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
        </div>
      }
    >
      <YoklamaContent />
    </Suspense>
  );
}
