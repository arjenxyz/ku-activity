'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiCamera, FiCheckCircle, FiHash } from 'react-icons/fi';
import { QrCameraScanner } from '@/components/registration/QrCameraScanner';
import { PersonnelShell } from '@/components/personnel/PersonnelShell';
import { parseAttendanceTokenFromQr } from '@/lib/attendance-qr-service';
import { scanAttendanceQr } from '@/lib/personnel-api';
import { btnPrimary, inputClass } from '@/components/project/ui';

function YoklamaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('t') ?? searchParams.get('token') ?? '';

  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tab, setTab] = useState<'scan' | 'code'>('scan');

  const submitToken = useCallback(
    async (raw: string) => {
      const token = parseAttendanceTokenFromQr(raw);
      if (!token) {
        setError('Geçerli bir yoklama QR kodu değil.');
        return;
      }
      setScanning(true);
      setError(null);
      setSuccess(null);
      try {
        const result = await scanAttendanceQr(token);
        setSuccess(result.message ?? 'Yoklama listesine eklendiniz.');
        window.setTimeout(() => router.replace('/personnel-panel'), 2200);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Okutma başarısız');
      } finally {
        setScanning(false);
      }
    },
    [router]
  );

  useEffect(() => {
    if (tokenFromUrl && !success && !scanning) {
      void submitToken(tokenFromUrl);
    }
  }, [tokenFromUrl, submitToken, success, scanning]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submitToken(manualCode);
  };

  return (
    <PersonnelShell>
      <div className="mx-auto max-w-lg">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 px-5 py-6 text-white shadow-lg">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
          <div className="relative">
            <p className="text-xs font-medium uppercase tracking-wider text-emerald-100/90">
              Günlük yoklama
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">QR okut</h1>
            <p className="mt-2 text-sm leading-relaxed text-emerald-50/90">
              Ustanın ekranındaki kodu okutun. Sıranız gelince listeye ekleneceksiniz.
            </p>
          </div>
        </div>

        {success ? (
          <div className="mt-6 overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50 to-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <FiCheckCircle className="w-9 h-9 text-emerald-600" />
            </div>
            <p className="mt-4 text-lg font-semibold text-emerald-900">{success}</p>
            <p className="mt-2 text-sm text-emerald-700">Panele yönlendiriliyorsunuz…</p>
            <div className="mt-5 mx-auto h-1 w-32 overflow-hidden rounded-full bg-emerald-100">
              <div className="h-full w-full origin-left animate-[shrink_2.2s_linear_forwards] bg-emerald-500" />
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {/* Tab switch */}
            <div className="flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setTab('scan')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors ${
                  tab === 'scan'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <FiCamera className="w-4 h-4" />
                Kamera
              </button>
              <button
                type="button"
                onClick={() => setTab('code')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors ${
                  tab === 'code'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <FiHash className="w-4 h-4" />
                Kod gir
              </button>
            </div>

            {tab === 'scan' ? (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="text-sm font-medium text-slate-700">QR kodu kameraya gösterin</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Her personel okuttuktan sonra usta ekranındaki kod değişir.
                  </p>
                </div>
                <div className="p-3 sm:p-4">
                  <QrCameraScanner
                    onScan={(token) => void submitToken(token)}
                    parseQr={parseAttendanceTokenFromQr}
                    invalidQrMessage="Geçerli bir yoklama QR kodu değil."
                    disabled={scanning}
                  />
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleManualSubmit}
                className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-4"
              >
                <div>
                  <label
                    className="block text-sm font-medium text-slate-700 mb-2"
                    htmlFor="manual-code"
                  >
                    Yoklama kodu
                  </label>
                  <input
                    id="manual-code"
                    type="text"
                    className={`${inputClass} font-mono text-lg uppercase tracking-[0.2em] text-center`}
                    placeholder="YOK-..."
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    disabled={scanning}
                    autoComplete="off"
                    spellCheck={false}
                    inputMode="text"
                  />
                  <p className="mt-2 text-xs text-slate-500 text-center">
                    Ustanın ekranında görünen YOK- kodunu girin
                  </p>
                </div>
                <button
                  type="submit"
                  className={`${btnPrimary} w-full py-3.5 text-base touch-target`}
                  disabled={scanning || !manualCode.trim()}
                >
                  {scanning ? 'Gönderiliyor…' : 'Yoklamaya katıl'}
                </button>
              </form>
            )}

            {error && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                <span className="font-semibold text-slate-700">Not:</span> Yoklama usta bitirene
                kadar yevmiye yazılmaz. Yanlış okuttuysanız ustadan listeden kaldırmasını isteyin.
              </p>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes shrink {
          from {
            transform: scaleX(1);
          }
          to {
            transform: scaleX(0);
          }
        }
      `}</style>
    </PersonnelShell>
  );
}

export default function YoklamaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <YoklamaContent />
    </Suspense>
  );
}
