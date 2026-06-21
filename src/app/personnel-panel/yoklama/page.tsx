'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiCheckCircle } from 'react-icons/fi';
import { QrCameraScanner } from '@/components/registration/QrCameraScanner';
import { PersonnelShell } from '@/components/personnel/PersonnelShell';
import { parseAttendanceTokenFromQr } from '@/lib/attendance-qr-service';
import { scanAttendanceQr } from '@/lib/personnel-api';
import { btnPrimary, inputClass, labelClass } from '@/components/project/ui';

function YoklamaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('t') ?? searchParams.get('token') ?? '';

  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
      <div className="max-w-lg mx-auto">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">QR yoklama</h1>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
          Ustanın ekranındaki QR kodu okutun. Listeye ekleneceksiniz.
        </p>

        {success ? (
          <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <FiCheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
            <p className="mt-3 font-semibold text-emerald-800">{success}</p>
            <p className="text-sm text-emerald-700 mt-1">Panele yönlendiriliyorsunuz…</p>
          </div>
        ) : (
          <div className="mt-4 sm:mt-6 space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
              <QrCameraScanner
                onScan={(token) => void submitToken(token)}
                parseQr={parseAttendanceTokenFromQr}
                invalidQrMessage="Geçerli bir yoklama QR kodu değil."
                disabled={scanning}
              />
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div>
                <label className={labelClass} htmlFor="manual-code">
                  Kamera yoksa kodu gir
                </label>
                <input
                  id="manual-code"
                  type="text"
                  className={`${inputClass} font-mono uppercase tracking-wider text-base`}
                  placeholder="YOK-..."
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  disabled={scanning}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              <button
                type="submit"
                className={`${btnPrimary} w-full py-3 text-base touch-target`}
                disabled={scanning || !manualCode.trim()}
              >
                {scanning ? 'Okunuyor…' : 'Kodu gönder'}
              </button>
            </form>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
            )}
          </div>
        )}
      </div>
    </PersonnelShell>
  );
}

export default function YoklamaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <YoklamaContent />
    </Suspense>
  );
}
