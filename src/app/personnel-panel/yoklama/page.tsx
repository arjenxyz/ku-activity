'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiCheckCircle, FiCopy } from 'react-icons/fi';
import { QrCameraScanner } from '@/components/registration/QrCameraScanner';
import { RegistrationQrCode } from '@/components/registration/RegistrationQrCode';
import { PersonnelShell } from '@/components/personnel/PersonnelShell';
import { parseAttendanceTokenFromQr } from '@/lib/attendance-qr-service';
import {
  fetchPersonalAttendanceCode,
  scanAttendanceQr,
  type PersonalAttendancePayload,
} from '@/lib/personnel-api';
import { btnPrimary, inputClass, labelClass, cardClass } from '@/components/project/ui';

function YoklamaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('t') ?? searchParams.get('token') ?? '';

  const [personalData, setPersonalData] = useState<PersonalAttendancePayload | null>(null);
  const [personalLoading, setPersonalLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadPersonal = useCallback(async () => {
    setPersonalLoading(true);
    try {
      const data = await fetchPersonalAttendanceCode();
      setPersonalData(data);
      if (data.alreadyCheckedIn) {
        setSuccess('Bugün için yoklamanız zaten kayıtlı.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yüklenemedi');
    } finally {
      setPersonalLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPersonal();
  }, [loadPersonal]);

  const submitToken = useCallback(
    async (raw: string) => {
      const token = parseAttendanceTokenFromQr(raw);
      if (!token) {
        setError('Geçerli bir yoklama kodu değil.');
        return;
      }
      setScanning(true);
      setError(null);
      setSuccess(null);
      try {
        const result = await scanAttendanceQr(token);
        setSuccess(result.message ?? 'Yoklama kaydedildi.');
        window.setTimeout(() => router.replace('/personnel-panel'), 1800);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Yoklama kaydedilemedi');
      } finally {
        setScanning(false);
      }
    },
    [router]
  );

  useEffect(() => {
    if (tokenFromUrl && !success && !scanning && !personalLoading) {
      void submitToken(tokenFromUrl);
    }
  }, [tokenFromUrl, submitToken, success, scanning, personalLoading]);

  const handlePersonalConfirm = () => {
    if (personalData?.personal?.token) {
      void submitToken(personalData.personal.token);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submitToken(manualCode);
  };

  const copyPersonal = async () => {
    if (!personalData?.personal?.token) return;
    try {
      await navigator.clipboard.writeText(personalData.personal.token);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Kod kopyalanamadı');
    }
  };

  return (
    <PersonnelShell>
      <div className="max-w-lg mx-auto">
        <Link
          href="/personnel-panel"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-6"
        >
          <FiArrowLeft className="w-4 h-4" />
          Panele dön
        </Link>

        <h1 className="text-2xl font-bold text-slate-900">Yoklama</h1>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
          Önce kendi kişisel kodunuzla onaylayın veya ustanın sıra QR&apos;ını okutun. Kişisel kod
          yalnızca sizin hesabınızda çalışır.
        </p>

        {success ? (
          <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <FiCheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
            <p className="mt-3 font-semibold text-emerald-800">{success}</p>
            <p className="text-sm text-emerald-700 mt-1">Panele yönlendiriliyorsunuz…</p>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {personalLoading ? (
              <div className={`${cardClass} p-6 h-40 animate-pulse`} />
            ) : personalData?.personal ? (
              <div className={`${cardClass} p-5 sm:p-6`}>
                <p className="text-xs font-semibold text-violet-600 uppercase tracking-wide">
                  Kişisel kodunuz (PER-)
                </p>
                <p className="text-sm text-slate-500 mt-1 mb-4">
                  Bu kod size özeldir; başkası kullanamaz.
                </p>

                <div className="flex flex-col items-center">
                  <RegistrationQrCode value={personalData.personal.url} size={180} />
                  <div className="mt-4 w-full flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2.5">
                    <code className="flex-1 text-sm font-bold font-mono text-violet-900 tracking-wider break-all">
                      {personalData.personal.token}
                    </code>
                    <button
                      type="button"
                      onClick={() => void copyPersonal()}
                      className="shrink-0 p-1.5 rounded-lg text-violet-600 hover:bg-white"
                    >
                      <FiCopy className="w-4 h-4" />
                    </button>
                  </div>
                  {copied && <p className="text-xs text-emerald-600 mt-1">Kopyalandı</p>}
                </div>

                <button
                  type="button"
                  onClick={handlePersonalConfirm}
                  disabled={scanning}
                  className={`${btnPrimary} w-full mt-4`}
                >
                  {scanning ? 'Kaydediliyor…' : 'Kişisel kodumla onayla'}
                </button>
              </div>
            ) : personalData?.alreadyCheckedIn ? null : (
              <p className="text-sm text-amber-700 bg-amber-50 rounded-xl px-4 py-3">
                Kişisel kod oluşturulamadı. Usta QR ile yoklama yapabilirsiniz.
              </p>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-slate-500">veya usta QR okut (YOK-)</span>
              </div>
            </div>

            <QrCameraScanner
              onScan={(token) => void submitToken(token)}
              parseQr={parseAttendanceTokenFromQr}
              invalidQrMessage="Geçerli bir yoklama QR kodu değil."
              disabled={scanning}
            />

            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div>
                <label className={labelClass} htmlFor="manual-code">
                  Kod gir (PER- veya YOK-)
                </label>
                <input
                  id="manual-code"
                  type="text"
                  className={`${inputClass} font-mono uppercase tracking-wider`}
                  placeholder="PER-... veya YOK-..."
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  disabled={scanning}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              <button type="submit" className={btnPrimary} disabled={scanning || !manualCode.trim()}>
                {scanning ? 'Kaydediliyor…' : 'Kodu onayla'}
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
