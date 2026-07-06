'use client';


import Link from 'next/link';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FiCheckCircle, FiHash, FiInfo, FiMonitor, FiX } from 'react-icons/fi';
import { AttendanceCodeSheet } from '@/components/personnel/AttendanceCodeSheet';
import { AttendanceQrScanner } from '@/components/personnel/AttendanceQrScanner';
import {
  AttendanceScanErrorOverlay,
  AttendanceStatusSticker,
} from '@/components/personnel/AttendanceStatusSticker';
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
      return s;
    } catch {
      return null;
    }
  }, []);

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
    [status, shouldReplace, refreshStatus]
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
  const failureBlocked =
    !forceReplace && (status?.state === 'cancelled' || status?.state === 'removed');
  const showScanner = !loadingStatus && !failureBlocked;
  const scanPaused =
    scanning ||
    windowClosed ||
    (!forceReplace &&
      (status?.state === 'waiting' ||
        status?.state === 'completed' ||
        status?.state === 'cancelled' ||
        status?.state === 'removed'));

  return (
    <>
      {/* Mobil — tam ekran kamera, alt bar yok */}
      <div className="fixed inset-0 z-0 h-[100dvh] bg-black sm:hidden">
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

        {/* Üst kontroller: iptal + kod gir */}
        <div className="pointer-events-none absolute inset-x-0 top-[calc(3rem+env(safe-area-inset-top))] z-20 flex items-start justify-between gap-3 px-3 pb-2">
          <Link
            href="/personnel-panel"
            className="pointer-events-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black/45 text-white shadow-lg backdrop-blur-md transition active:bg-black/60"
            aria-label={strings.cancelAriaLabel}
          >
            <FiX className="h-5 w-5" />
          </Link>
          <button
            type="button"
            disabled={scanPaused && !forceReplace && status?.state !== 'cancelled' && status?.state !== 'removed'}
            onClick={() => {
              setError(null);
              setCodeSheetOpen(true);
            }}
            className="pointer-events-auto inline-flex h-11 items-center gap-2 rounded-full bg-black/45 px-4 text-sm font-semibold text-white shadow-lg backdrop-blur-md transition active:bg-black/60 disabled:opacity-40"
          >
            <FiHash className="h-4 w-4" />
            {strings.enterCodeButton}
          </button>
        </div>

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
          <div className="absolute inset-x-4 top-[calc(3.75rem+env(safe-area-inset-top))] z-[7] flex items-center gap-3 rounded-2xl border border-amber-200/20 bg-[#0f1a28]/95 px-3.5 py-2.5 text-xs text-amber-50 shadow-lg backdrop-blur-md">
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

        {windowClosed && (
          <div className="absolute inset-x-3 top-[calc(3.5rem+env(safe-area-inset-top))] z-[5] rounded-xl border border-amber-400/25 bg-amber-950/90 px-3 py-2.5 text-xs text-amber-50 shadow-lg">
            <p className="font-semibold">{strings.outsideWindowTitle}</p>
            <p className="mt-1 opacity-90">{status?.window?.message}</p>
          </div>
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
}) {
  const strings = useRegistryStrings('app/personnel-panel/yoklama/page');
  const formDisabled = scanning || windowClosed || loading;

  return (
    <div className="mt-4 space-y-4">
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 px-5 py-5 text-white shadow-lg">
        <p className="text-xs font-medium uppercase tracking-wider text-emerald-100/90">{strings.desktop.eyebrow}</p>
        <h1 className="mt-1 text-2xl font-bold">{strings.desktop.title}</h1>
        <p className="mt-2 text-sm text-emerald-50/90">{strings.desktop.subtitle}</p>
      </div>

      <div className="flex gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3.5 text-sm text-sky-950 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100">
        <FiMonitor className="mt-0.5 h-5 w-5 shrink-0 text-sky-600 dark:text-sky-400" />
        <div className="space-y-1 leading-relaxed">
          <p className="font-medium">{strings.desktop.qrNotSupportedTitle}</p>
          <p className="text-sky-800/90 dark:text-sky-200/90">
            {strings.desktop.qrNotSupportedBody}
          </p>
        </div>
      </div>

      {status && status.state !== 'none' && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900">
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

      {windowClosed && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">{strings.outsideWindowTitle}</p>
          <p className="mt-1">{status?.window?.message}</p>
        </div>
      )}

      <form
        onSubmit={onManualSubmit}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <div>
          <label
            htmlFor="desktop-attendance-code"
            className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            <FiHash className="h-4 w-4 text-emerald-600" />
            {strings.desktop.codeLabel}
          </label>
          <input
            id="desktop-attendance-code"
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.toUpperCase())}
            placeholder={strings.desktop.codePlaceholder}
            disabled={formDisabled}
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-center font-mono text-lg uppercase tracking-[0.15em] text-slate-900 outline-none ring-emerald-500/30 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <button
          type="submit"
          disabled={formDisabled || !manualCode.trim()}
          className="w-full rounded-xl bg-emerald-600 py-3.5 font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {scanning ? strings.desktop.submitScanning : forceReplace ? strings.desktop.submitRescan : strings.desktop.submitJoin}
        </button>
        <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          <FiInfo className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {strings.desktop.codeHint}
        </p>
      </form>

      {successMsg && (
        <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          <FiCheckCircle className="h-4 w-4 shrink-0" />
          {successMsg}
        </p>
      )}
      {error && (
        <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
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
