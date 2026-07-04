'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiHash,
  FiRefreshCw,
} from 'react-icons/fi';
import { AttendanceCodeSheet } from '@/components/personnel/AttendanceCodeSheet';
import { AttendanceQrScanner } from '@/components/personnel/AttendanceQrScanner';
import { formatDateTime } from '@/lib/format';
import { parseAttendanceTokenFromQr } from '@/lib/attendance-qr-service';
import {
  fetchPersonnelAttendanceStatus,
  scanAttendanceQr,
  type PersonnelAttendanceStatusPayload,
} from '@/lib/personnel-api';

type ViewMode = 'scan' | 'waiting' | 'completed' | 'cancelled' | 'removed' | 'rescan';

function YoklamaContent() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('t') ?? searchParams.get('token') ?? '';

  const [view, setView] = useState<ViewMode>('scan');
  const [status, setStatus] = useState<PersonnelAttendanceStatusPayload | null>(null);
  const [scanning, setScanning] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [manualCode, setManualCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [codeSheetOpen, setCodeSheetOpen] = useState(false);
  const [autoScanned, setAutoScanned] = useState(false);

  const applyStatus = useCallback((s: PersonnelAttendanceStatusPayload) => {
    setStatus(s);
    if (s.state === 'waiting') setView('waiting');
    else if (s.state === 'completed') setView('completed');
    else if (s.state === 'cancelled') setView('cancelled');
    else if (s.state === 'removed') setView('removed');
    else setView('scan');
  }, []);

  const refreshStatus = useCallback(async () => {
    try {
      const s = await fetchPersonnelAttendanceStatus();
      applyStatus(s);
      return s;
    } catch {
      return null;
    }
  }, [applyStatus]);

  useEffect(() => {
    void (async () => {
      setLoadingStatus(true);
      await refreshStatus();
      setLoadingStatus(false);
    })();
  }, [refreshStatus]);

  useEffect(() => {
    if (view !== 'waiting' && view !== 'removed') return;
    const timer = window.setInterval(() => void refreshStatus(), 4000);
    return () => window.clearInterval(timer);
  }, [view, refreshStatus]);

  const submitToken = useCallback(
    async (raw: string, replace = false) => {
      const token = parseAttendanceTokenFromQr(raw);
      if (!token) {
        setError('Geçerli bir yoklama QR kodu değil.');
        return;
      }
      setScanning(true);
      setError(null);
      try {
        const result = await scanAttendanceQr(token, { replace });
        if (result.status) {
          applyStatus(result.status);
        } else {
          await refreshStatus();
        }
        setCodeSheetOpen(false);
        if (replace) setView('waiting');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Okutma başarısız');
      } finally {
        setScanning(false);
      }
    },
    [applyStatus, refreshStatus]
  );

  useEffect(() => {
    if (
      tokenFromUrl &&
      !autoScanned &&
      !scanning &&
      !loadingStatus &&
      (view === 'scan' || view === 'rescan')
    ) {
      setAutoScanned(true);
      void submitToken(tokenFromUrl, view === 'rescan');
    }
  }, [tokenFromUrl, autoScanned, scanning, loadingStatus, view, submitToken]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submitToken(manualCode, view === 'rescan');
  };

  const startRescan = () => {
    setError(null);
    setManualCode('');
    setCodeSheetOpen(false);
    setView('rescan');
  };

  const cancelRescan = () => {
    setError(null);
    setCodeSheetOpen(false);
    void refreshStatus();
  };

  const showScanner = view === 'scan' || view === 'rescan';
  const windowClosed = Boolean(status?.window && !status.window.isOpen && status.state === 'none');
  const scannerDisabled = scanning || windowClosed;

  if (loadingStatus && !status) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center sm:min-h-[40vh]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (showScanner) {
    return (
      <>
        <div className="fixed inset-x-0 top-[calc(3rem+env(safe-area-inset-top))] bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-0 flex flex-col sm:hidden">
          {view === 'rescan' && (
            <div className="relative z-30 shrink-0 border-b border-amber-400/30 bg-amber-950/90 px-4 py-2.5 text-xs text-amber-100">
              Önceki kaydınız silinip yeni okutma ile listeye ekleneceksiniz.{' '}
              <button type="button" onClick={cancelRescan} className="font-semibold underline">
                Vazgeç
              </button>
            </div>
          )}

          {windowClosed && (
            <div className="relative z-30 shrink-0 border-b border-amber-400/30 bg-amber-950/95 px-4 py-3 text-sm text-amber-50">
              <p className="font-semibold">Yoklama saati dışında</p>
              <p className="mt-1 text-xs leading-relaxed opacity-90">{status?.window?.message}</p>
            </div>
          )}

          <AttendanceQrScanner
            onScan={(t) => void submitToken(t, view === 'rescan')}
            disabled={scannerDisabled}
            parseQr={parseAttendanceTokenFromQr}
            invalidQrMessage="Geçerli bir yoklama QR kodu değil."
          />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-4">
            <button
              type="button"
              disabled={scannerDisabled}
              onClick={() => {
                setError(null);
                setCodeSheetOpen(true);
              }}
              className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/45 px-5 py-3 text-sm font-semibold text-white shadow-lg backdrop-blur-md transition hover:bg-black/55 disabled:opacity-50"
            >
              <FiHash className="h-4 w-4" />
              Kod gir
            </button>
          </div>

          {error && !codeSheetOpen && (
            <div className="absolute inset-x-4 bottom-[4.5rem] z-30 rounded-xl border border-red-400/40 bg-red-950/90 px-4 py-3 text-center text-sm text-red-100">
              {error}
            </div>
          )}
        </div>

        {/* Masaüstü / geniş ekran */}
        <div className="mx-auto hidden max-w-lg sm:block">
          <DesktopScannerPanel
            view={view}
            status={status}
            scanning={scanning}
            manualCode={manualCode}
            setManualCode={setManualCode}
            error={error}
            windowClosed={windowClosed}
            onScan={(t) => void submitToken(t, view === 'rescan')}
            onManualSubmit={handleManualSubmit}
            onCancelRescan={cancelRescan}
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
          isRescan={view === 'rescan'}
        />
      </>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-1 sm:px-0">
      {view === 'waiting' && (
        <StatusCard
          tone="waiting"
          icon={<FiClock className="h-7 w-7 text-emerald-500 animate-pulse" />}
          title="Okutma başarılı"
          message={
            status?.message ??
            'Listeye eklendiniz. Ustanız diğer personelin yoklamasını alıp işlemi tamamlayacak.'
          }
          meta={status?.listedAt ? `Okutma: ${formatDateTime(status.listedAt)}` : undefined}
          footer="Usta yoklamayı bitirdiğinde bu ekran otomatik güncellenir."
          onRefresh={() => void refreshStatus()}
          onProblem={startRescan}
        />
      )}

      {view === 'completed' && (
        <StatusCard
          tone="success"
          icon={<FiCheckCircle className="h-8 w-8 text-emerald-500" />}
          title="Bugünün yoklaması tamamlandı"
          message={status?.message ?? 'Tam gün yevmiyeniz kaydedildi.'}
          meta={status?.completedAt ? `Tamamlanma: ${formatDateTime(status.completedAt)}` : undefined}
          onProblem={startRescan}
        />
      )}

      {view === 'cancelled' && (
        <StatusCard
          tone="warning"
          icon={<FiAlertCircle className="h-8 w-8 text-amber-500" />}
          title="Yoklama iptal edildi"
          message={
            status?.message ??
            'Yoklama iptal edildi. Lütfen yöneticinizle iletişime geçip tekrar okutun.'
          }
          primaryAction={{ label: 'Yeni kod ile okut', onClick: startRescan }}
        />
      )}

      {view === 'removed' && (
        <StatusCard
          tone="danger"
          icon={<FiAlertCircle className="h-8 w-8 text-red-500" />}
          title="Yoklamadan çıkarıldınız"
          message={
            status?.message ??
            'Yöneticiniz sizi yoklamadan çıkardı. Yanlış olduğunu düşünüyorsanız yöneticinizle iletişime geçin.'
          }
          primaryAction={{ label: 'Yeni kod ile tekrar okut', onClick: startRescan }}
        />
      )}
    </div>
  );
}

function DesktopScannerPanel({
  view,
  status,
  scanning,
  manualCode,
  setManualCode,
  error,
  windowClosed,
  onScan,
  onManualSubmit,
  onCancelRescan,
}: {
  view: ViewMode;
  status: PersonnelAttendanceStatusPayload | null;
  scanning: boolean;
  manualCode: string;
  setManualCode: (v: string) => void;
  error: string | null;
  windowClosed: boolean;
  onScan: (token: string) => void;
  onManualSubmit: (e: React.FormEvent) => void;
  onCancelRescan: () => void;
}) {
  const [mode, setMode] = useState<'camera' | 'code'>('camera');

  return (
    <div className="mt-4 space-y-4">
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 px-5 py-5 text-white shadow-lg">
        <p className="text-xs font-medium uppercase tracking-wider text-emerald-100/90">Günlük yoklama</p>
        <h1 className="mt-1 text-2xl font-bold">{view === 'rescan' ? 'Yeniden okut' : 'QR okut'}</h1>
        <p className="mt-2 text-sm text-emerald-50/90">Ustanın ekranındaki kodu okutun veya kod girin.</p>
      </div>

      {view === 'rescan' && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Önceki kaydınız silinecek.
          <button type="button" onClick={onCancelRescan} className="ml-1 font-medium underline">
            Vazgeç
          </button>
        </div>
      )}

      {windowClosed && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">Yoklama saati dışında</p>
          <p className="mt-1">{status?.window?.message}</p>
        </div>
      )}

      <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        <button
          type="button"
          onClick={() => setMode('camera')}
          className={`flex-1 rounded-lg py-2.5 text-sm font-medium ${
            mode === 'camera' ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-900 dark:text-emerald-300' : 'text-slate-600'
          }`}
        >
          Kamera
        </button>
        <button
          type="button"
          onClick={() => setMode('code')}
          className={`flex-1 rounded-lg py-2.5 text-sm font-medium ${
            mode === 'code' ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-900 dark:text-emerald-300' : 'text-slate-600'
          }`}
        >
          Kod gir
        </button>
      </div>

      {mode === 'camera' ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-sm dark:border-slate-700">
          <div className="relative h-[min(420px,55vh)]">
            <AttendanceQrScanner
              onScan={onScan}
              disabled={scanning || windowClosed}
              parseQr={parseAttendanceTokenFromQr}
            />
          </div>
        </div>
      ) : (
        <form onSubmit={onManualSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.toUpperCase())}
            placeholder="YOK-…"
            disabled={scanning || windowClosed}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center font-mono text-lg uppercase tracking-[0.15em] dark:border-slate-700 dark:bg-slate-800"
          />
          <button
            type="submit"
            disabled={scanning || windowClosed || !manualCode.trim()}
            className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {scanning ? 'Gönderiliyor…' : 'Yoklamaya katıl'}
          </button>
        </form>
      )}

      {error && (
        <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      )}
    </div>
  );
}

function StatusCard({
  tone,
  icon,
  title,
  message,
  meta,
  footer,
  onRefresh,
  onProblem,
  primaryAction,
}: {
  tone: 'waiting' | 'success' | 'warning' | 'danger';
  icon: React.ReactNode;
  title: string;
  message: string;
  meta?: string;
  footer?: string;
  onRefresh?: () => void;
  onProblem?: () => void;
  primaryAction?: { label: string; onClick: () => void };
}) {
  const toneStyles = {
    waiting: 'border-emerald-200 bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950/40 dark:to-slate-900 dark:border-emerald-900',
    success: 'border-emerald-200 bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950/40 dark:to-slate-900 dark:border-emerald-900',
    warning: 'border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900',
    danger: 'border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900',
  } as const;

  return (
    <div className="mt-2 space-y-4 sm:mt-4">
      <div className={`overflow-hidden rounded-2xl border p-6 shadow-sm ${toneStyles[tone]}`}>
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/80 dark:bg-slate-800/80">
            {icon}
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{message}</p>
          {meta && <p className="mt-2 text-xs text-slate-500">{meta}</p>}
          {footer && (
            <p className="mt-4 rounded-xl bg-white/70 px-4 py-3 text-sm text-slate-600 dark:bg-slate-800/70 dark:text-slate-300">
              {footer}
            </p>
          )}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400"
            >
              <FiRefreshCw className="h-4 w-4" />
              Durumu yenile
            </button>
          )}
          {primaryAction && (
            <button
              type="button"
              onClick={primaryAction.onClick}
              className="mt-5 w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              {primaryAction.label}
            </button>
          )}
        </div>
      </div>

      {onProblem && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Sorun varsa ustanızla iletişime geçin. Yeni QR veya kod aldıysanız yeniden okutun — önceki
            kayıt silinir.
          </p>
          <button
            type="button"
            onClick={onProblem}
            className="mt-4 w-full rounded-xl border border-slate-300 bg-slate-50 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            Sorun var — yeniden okut
          </button>
        </div>
      )}
    </div>
  );
}

export default function YoklamaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
      }
    >
      <YoklamaContent />
    </Suspense>
  );
}
