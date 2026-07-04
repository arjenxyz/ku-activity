'use client';

import Link from 'next/link';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FiCheckCircle, FiClock, FiHash, FiX } from 'react-icons/fi';
import { AttendanceCodeSheet } from '@/components/personnel/AttendanceCodeSheet';
import { AttendanceQrScanner } from '@/components/personnel/AttendanceQrScanner';
import { parseAttendanceTokenFromQr } from '@/lib/attendance-qr-service';
import {
  fetchPersonnelAttendanceStatus,
  scanAttendanceQr,
  type PersonnelAttendanceStatusPayload,
} from '@/lib/personnel-api';

function YoklamaContent() {
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
        setError('Geçerli bir yoklama QR kodu değil.');
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
        setSuccessMsg(replace ? 'Yeniden kaydedildi.' : 'Okutma başarılı.');
        window.setTimeout(() => setSuccessMsg(null), 3500);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Okutma başarısız');
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
  const scannerDisabled = scanning || windowClosed;

  return (
    <>
      {/* Mobil — tam ekran kamera, alt bar yok */}
      <div className="fixed inset-x-0 top-0 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-0 bg-black sm:hidden">
        <AttendanceQrScanner
          className="absolute inset-0"
          onScan={(t) => void submitToken(t)}
          disabled={scannerDisabled}
          parseQr={parseAttendanceTokenFromQr}
          invalidQrMessage="Geçerli bir yoklama QR kodu değil."
        />

        {/* Üst kontroller: iptal + kod gir */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 px-3 pb-2 safe-pt">
          <Link
            href="/personnel-panel"
            className="pointer-events-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black/45 text-white shadow-lg backdrop-blur-md transition active:bg-black/60"
            aria-label="İptal — panele dön"
          >
            <FiX className="h-5 w-5" />
          </Link>
          <button
            type="button"
            disabled={scannerDisabled}
            onClick={() => {
              setError(null);
              setCodeSheetOpen(true);
            }}
            className="pointer-events-auto inline-flex h-11 items-center gap-2 rounded-full bg-black/45 px-4 text-sm font-semibold text-white shadow-lg backdrop-blur-md transition active:bg-black/60 disabled:opacity-40"
          >
            <FiHash className="h-4 w-4" />
            Kod gir
          </button>
        </div>

        {status && (
          <StatusBanner
            status={status}
            forceReplace={forceReplace}
            onForceReplace={() => setForceReplace(true)}
            onCancelReplace={() => setForceReplace(false)}
          />
        )}

        {windowClosed && (
          <div className="absolute inset-x-3 top-[calc(3.5rem+env(safe-area-inset-top))] z-[5] rounded-xl border border-amber-400/25 bg-amber-950/90 px-3 py-2.5 text-xs text-amber-50 shadow-lg">
            <p className="font-semibold">Yoklama saati dışında</p>
            <p className="mt-1 opacity-90">{status?.window?.message}</p>
          </div>
        )}

        {successMsg && (
          <div className="absolute inset-x-4 bottom-6 z-[5] flex items-center justify-center gap-2 rounded-xl bg-emerald-600/95 px-4 py-3 text-sm font-medium text-white shadow-lg">
            <FiCheckCircle className="h-4 w-4 shrink-0" />
            {successMsg}
          </div>
        )}

        {error && !codeSheetOpen && !successMsg && (
          <div className="absolute inset-x-4 bottom-6 z-[5] rounded-xl bg-red-950/90 px-4 py-2.5 text-center text-sm text-red-100">
            {error}
          </div>
        )}
      </div>

      {/* Masaüstü */}
      <div className="mx-auto hidden max-w-lg sm:block">
        <DesktopScannerPanel
          status={status}
          loading={loadingStatus}
          scanning={scanning}
          manualCode={manualCode}
          setManualCode={setManualCode}
          error={error}
          successMsg={successMsg}
          windowClosed={windowClosed}
          forceReplace={forceReplace}
          onForceReplace={() => setForceReplace(true)}
          onCancelReplace={() => setForceReplace(false)}
          onScan={(t) => void submitToken(t)}
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
      />
    </>
  );
}

function StatusBanner({
  status,
  forceReplace,
  onForceReplace,
  onCancelReplace,
}: {
  status: PersonnelAttendanceStatusPayload;
  forceReplace: boolean;
  onForceReplace: () => void;
  onCancelReplace: () => void;
}) {
  if (status.state === 'none') return null;

  const configs = {
    waiting: {
      className: 'border-emerald-400/30 bg-emerald-950/90 text-emerald-50',
      icon: <FiClock className="h-4 w-4 shrink-0 animate-pulse text-emerald-400" />,
      title: 'Listeye eklendiniz',
      hint: 'Usta yoklamayı tamamlayana kadar bekleyin.',
    },
    completed: {
      className: 'border-emerald-400/30 bg-emerald-950/90 text-emerald-50',
      icon: <FiCheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />,
      title: 'Bugün tamamlandı',
      hint: status.message ?? 'Tam gün kaydınız oluştu.',
    },
    cancelled: {
      className: 'border-amber-400/30 bg-amber-950/90 text-amber-50',
      icon: null,
      title: 'Yoklama iptal',
      hint: 'Yeni QR okutun — otomatik yeniden kaydedilir.',
    },
    removed: {
      className: 'border-red-400/30 bg-red-950/90 text-red-50',
      icon: null,
      title: 'Listeden çıkarıldınız',
      hint: 'Yeni QR okutun veya ustanızla görüşün.',
    },
  } as const;

  const cfg = configs[status.state as keyof typeof configs];
  if (!cfg) return null;

  const showRescanToggle =
    (status.state === 'waiting' || status.state === 'completed') && !forceReplace;

  return (
    <div
      className={`absolute inset-x-3 top-[calc(3.75rem+env(safe-area-inset-top))] z-[5] rounded-xl border px-3 py-2.5 text-xs shadow-lg backdrop-blur-sm ${cfg.className}`}
    >
      <div className="flex items-start gap-2">
        {cfg.icon}
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{cfg.title}</p>
          <p className="mt-0.5 leading-snug opacity-90">{cfg.hint}</p>
        </div>
        {forceReplace && (
          <button
            type="button"
            onClick={onCancelReplace}
            className="shrink-0 rounded-lg p-1 opacity-70 hover:opacity-100"
            aria-label="Yeniden okutmayı iptal"
          >
            <FiX className="h-4 w-4" />
          </button>
        )}
      </div>
      {showRescanToggle && (
        <button
          type="button"
          onClick={onForceReplace}
          className="mt-2 text-[11px] font-semibold underline opacity-90"
        >
          Sorun var — yeniden okut
        </button>
      )}
      {forceReplace && status.state !== 'cancelled' && status.state !== 'removed' && (
        <p className="mt-1.5 text-[11px] font-medium text-amber-200">
          Yeniden okutma modu: önceki kayıt silinir.
        </p>
      )}
    </div>
  );
}

function DesktopScannerPanel({
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
  onScan,
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
  onScan: (token: string) => void;
  onManualSubmit: (e: React.FormEvent) => void;
}) {
  const [mode, setMode] = useState<'camera' | 'code'>('camera');

  return (
    <div className="mt-4 space-y-4">
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 px-5 py-5 text-white shadow-lg">
        <p className="text-xs font-medium uppercase tracking-wider text-emerald-100/90">Günlük yoklama</p>
        <h1 className="mt-1 text-2xl font-bold">QR okut</h1>
        <p className="mt-2 text-sm text-emerald-50/90">Ustanın ekranındaki kodu okutun veya kod girin.</p>
      </div>

      {status && status.state !== 'none' && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="font-medium text-slate-900 dark:text-white">{status.message}</p>
          {(status.state === 'waiting' || status.state === 'completed') && !forceReplace && (
            <button type="button" onClick={onForceReplace} className="mt-2 text-xs font-semibold text-emerald-600 underline">
              Yeniden okut
            </button>
          )}
          {forceReplace && (
            <button type="button" onClick={onCancelReplace} className="mt-2 text-xs font-semibold text-amber-600 underline">
              Yeniden okutmayı iptal
            </button>
          )}
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
            mode === 'camera' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
          }`}
        >
          Kamera
        </button>
        <button
          type="button"
          onClick={() => setMode('code')}
          className={`flex-1 rounded-lg py-2.5 text-sm font-medium ${
            mode === 'code' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
          }`}
        >
          Kod gir
        </button>
      </div>

      {mode === 'camera' ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-sm">
          <div className="relative h-[min(420px,55vh)]">
            {!loading && (
              <AttendanceQrScanner
                onScan={onScan}
                disabled={scanning || windowClosed}
                parseQr={parseAttendanceTokenFromQr}
              />
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={onManualSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.toUpperCase())}
            placeholder="YOK-…"
            disabled={scanning || windowClosed}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center font-mono text-lg uppercase tracking-[0.15em]"
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

      {successMsg && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {successMsg}
        </p>
      )}
      {error && (
        <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
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
