'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  FiAlertCircle,
  FiCamera,
  FiCheckCircle,
  FiClock,
  FiHash,
  FiRefreshCw,
} from 'react-icons/fi';
import { QrCameraScanner } from '@/components/registration/QrCameraScanner';
import { PersonnelShell } from '@/components/personnel/PersonnelShell';
import { formatDateTime } from '@/lib/format';
import { parseAttendanceTokenFromQr } from '@/lib/attendance-qr-service';
import {
  fetchPersonnelAttendanceStatus,
  scanAttendanceQr,
  type PersonnelAttendanceStatusPayload,
} from '@/lib/personnel-api';
import { btnPrimary, inputClass } from '@/components/project/ui';

type ViewMode = 'scan' | 'waiting' | 'completed' | 'cancelled' | 'rescan';

function YoklamaContent() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('t') ?? searchParams.get('token') ?? '';

  const [view, setView] = useState<ViewMode>('scan');
  const [status, setStatus] = useState<PersonnelAttendanceStatusPayload | null>(null);
  const [scanning, setScanning] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [manualCode, setManualCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'scan' | 'code'>('scan');
  const [autoScanned, setAutoScanned] = useState(false);

  const applyStatus = useCallback((s: PersonnelAttendanceStatusPayload) => {
    setStatus(s);
    if (s.state === 'waiting') setView('waiting');
    else if (s.state === 'completed') setView('completed');
    else if (s.state === 'cancelled') setView('cancelled');
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
    if (view !== 'waiting') return;
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
        if (replace) {
          setView('waiting');
        }
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
    setTab('scan');
    setView('rescan');
  };

  const showScanner = view === 'scan' || view === 'rescan';

  return (
    <PersonnelShell>
      <div className="mx-auto max-w-lg">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 px-5 py-6 text-white shadow-lg">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
          <div className="relative">
            <p className="text-xs font-medium uppercase tracking-wider text-emerald-100/90">
              Günlük yoklama
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              {view === 'rescan' ? 'Yeniden okut' : 'QR okut'}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-emerald-50/90">
              {view === 'waiting'
                ? 'Ustanız yoklamayı tamamlayana kadar bu ekranda kalabilirsiniz.'
                : view === 'completed'
                  ? 'Bugünkü yoklamanız kayıt altına alındı.'
                  : view === 'rescan'
                    ? 'Ustanızdan yeni QR veya kod alıp tekrar okutun.'
                    : 'Ustanın ekranındaki kodu okutun.'}
            </p>
          </div>
        </div>

        {loadingStatus && !status ? (
          <div className="mt-6 h-48 rounded-2xl bg-slate-100 animate-pulse" />
        ) : view === 'waiting' ? (
          <WaitingScreen
            status={status}
            onProblem={startRescan}
            onRefresh={() => void refreshStatus()}
          />
        ) : view === 'completed' ? (
          <CompletedScreen status={status} onProblem={startRescan} />
        ) : view === 'cancelled' ? (
          <CancelledScreen onRescan={startRescan} />
        ) : showScanner ? (
          <>
            {status?.window && !status.window.isOpen && status.state === 'none' && (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
                <p className="font-semibold">Yoklama saati dışında</p>
                <p className="mt-2 leading-relaxed">{status.window.message}</p>
                <p className="mt-2 text-xs opacity-90">
                  İzin verilen süre: {status.window.windowStartLabel} –{' '}
                  {status.window.windowEndLabel}
                </p>
              </div>
            )}
            <ScannerSection
            tab={tab}
            setTab={setTab}
            scanning={scanning}
            manualCode={manualCode}
            setManualCode={setManualCode}
            onScan={(t) => void submitToken(t, view === 'rescan')}
            onManualSubmit={handleManualSubmit}
            error={error}
            isRescan={view === 'rescan'}
            onCancelRescan={() => void refreshStatus()}
            scannerDisabled={
              Boolean(status?.window && !status.window.isOpen && status.state === 'none')
            }
          />
          </>
        ) : null}
      </div>
    </PersonnelShell>
  );
}

function WaitingScreen({
  status,
  onProblem,
  onRefresh,
}: {
  status: PersonnelAttendanceStatusPayload | null;
  onProblem: () => void;
  onRefresh: () => void;
}) {
  return (
    <div className="mt-6 space-y-4">
      <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50 to-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-100">
            <FiClock className="h-7 w-7 text-emerald-600 animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold text-emerald-900">Okutma başarılı</p>
            <p className="mt-2 text-sm leading-relaxed text-emerald-800">
              {status?.message ??
                'Listeye eklendiniz. Ustanız diğer personelin yoklamasını alıp işlemi tamamlayacak.'}
            </p>
            {status?.listedAt && (
              <p className="mt-2 text-xs text-emerald-600">
                Okutma: {formatDateTime(status.listedAt)}
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-emerald-100 bg-white/80 px-4 py-3">
          <p className="text-sm text-slate-600 leading-relaxed">
            Usta yoklamayı bitirdiğinde bu ekran otomatik güncellenir ve{' '}
            <span className="font-medium text-slate-800">bugünün yoklaması tamamlandı</span>{' '}
            mesajını görürsünüz.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-900"
        >
          <FiRefreshCw className="h-4 w-4" />
          Durumu yenile
        </button>
      </div>

      <ProblemButton onClick={onProblem} />
    </div>
  );
}

function CompletedScreen({
  status,
  onProblem,
}: {
  status: PersonnelAttendanceStatusPayload | null;
  onProblem: () => void;
}) {
  return (
    <div className="mt-6 space-y-4">
      <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50 to-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <FiCheckCircle className="h-9 w-9 text-emerald-600" />
        </div>
        <p className="mt-4 text-lg font-semibold text-emerald-900">Bugünün yoklaması tamamlandı</p>
        <p className="mt-2 text-sm text-emerald-700">
          {status?.message ?? 'Tam gün yevmiyeniz kaydedildi.'}
        </p>
        {status?.completedAt && (
          <p className="mt-2 text-xs text-emerald-600">
            Tamamlanma: {formatDateTime(status.completedAt)}
          </p>
        )}
      </div>

      <ProblemButton onClick={onProblem} />
    </div>
  );
}

function CancelledScreen({ onRescan }: { onRescan: () => void }) {
  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
        <FiAlertCircle className="mx-auto h-10 w-10 text-amber-600" />
        <p className="mt-3 font-semibold text-amber-900">Yoklama iptal edildi</p>
        <p className="mt-2 text-sm text-amber-800">
          Ustanızla iletişime geçin ve yeni yoklama için QR kodu alın.
        </p>
        <button type="button" onClick={onRescan} className={`${btnPrimary} mt-5 w-full py-3`}>
          Yeni kod ile okut
        </button>
      </div>
    </div>
  );
}

function ProblemButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-600 leading-relaxed">
        Herhangi bir sorun varsa önce ustanızla iletişime geçin. Usta size yeni QR veya kod
        verdiyse aşağıdaki butona tıklayıp yeniden okutun — önceki yevmiye kaydınız silinir,
        yenisi oluşturulur.
      </p>
      <button
        type="button"
        onClick={onClick}
        className="mt-4 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-100 transition-colors"
      >
        Sorun var — yeniden okut
      </button>
    </div>
  );
}

function ScannerSection({
  tab,
  setTab,
  scanning,
  manualCode,
  setManualCode,
  onScan,
  onManualSubmit,
  error,
  isRescan,
  onCancelRescan,
  scannerDisabled = false,
}: {
  tab: 'scan' | 'code';
  setTab: (t: 'scan' | 'code') => void;
  scanning: boolean;
  manualCode: string;
  setManualCode: (v: string) => void;
  onScan: (token: string) => void;
  onManualSubmit: (e: React.FormEvent) => void;
  error: string | null;
  isRescan: boolean;
  onCancelRescan: () => void;
  scannerDisabled?: boolean;
}) {
  return (
    <div className="mt-5 space-y-4">
      {isRescan && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Önceki kaydınız silinecek ve yeni okutmanızla listeye tekrar ekleneceksiniz.
          <button
            type="button"
            onClick={onCancelRescan}
            className="mt-2 block text-xs font-medium text-amber-800 underline"
          >
            Vazgeç
          </button>
        </div>
      )}

      <div className="flex rounded-xl bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setTab('scan')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors ${
            tab === 'scan' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
          }`}
        >
          <FiCamera className="h-4 w-4" />
          Kamera
        </button>
        <button
          type="button"
          onClick={() => setTab('code')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors ${
            tab === 'code' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
          }`}
        >
          <FiHash className="h-4 w-4" />
          Kod gir
        </button>
      </div>

      {tab === 'scan' ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-sm font-medium text-slate-700">QR kodu kameraya gösterin</p>
          </div>
          <div className="p-3 sm:p-4">
            <QrCameraScanner
              onScan={onScan}
              parseQr={parseAttendanceTokenFromQr}
              invalidQrMessage="Geçerli bir yoklama QR kodu değil."
              disabled={scanning || scannerDisabled}
            />
          </div>
        </div>
      ) : (
        <form
          onSubmit={onManualSubmit}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="manual-code">
              Yoklama kodu
            </label>
            <input
              id="manual-code"
              type="text"
              className={`${inputClass} text-center font-mono text-lg uppercase tracking-[0.2em]`}
              placeholder="YOK-..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              disabled={scanning || scannerDisabled}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <button
            type="submit"
            className={`${btnPrimary} w-full py-3.5 text-base touch-target`}
                  disabled={scanning || scannerDisabled || !manualCode.trim()}
          >
            {scanning ? 'Gönderiliyor…' : isRescan ? 'Yeniden okut' : 'Yoklamaya katıl'}
          </button>
        </form>
      )}

      {error && (
        <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
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
        <div className="flex min-h-[100dvh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
        </div>
      }
    >
      <YoklamaContent />
    </Suspense>
  );
}
