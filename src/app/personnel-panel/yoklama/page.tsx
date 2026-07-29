'use client';


import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FiCheckCircle, FiX } from 'react-icons/fi';
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
      {/* Tüm ekranlarda tam ekran immersive kamera */}
      <div className="fixed inset-x-0 bottom-0 personnel-topbar-top z-0 bg-black">
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
