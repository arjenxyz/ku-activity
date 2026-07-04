'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { FiArrowLeft, FiCheckCircle, FiHash, FiLoader } from 'react-icons/fi';
import { normalizeAdvanceCashToken, parseAdvanceCashTokenFromQr } from '@/lib/advance-cash-token';

const AttendanceQrScanner = dynamic(
  () => import('@/components/personnel/AttendanceQrScanner').then((m) => m.AttendanceQrScanner),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center py-24 gap-2 text-white/70">
        <FiLoader className="h-8 w-8 animate-spin" />
        <p className="text-sm">Kamera yükleniyor…</p>
      </div>
    ),
  }
);

function AvansOnayContent() {
  const searchParams = useSearchParams();
  const initialToken = searchParams.get('t') ?? '';
  const [mode, setMode] = useState<'scan' | 'code'>('scan');
  const [code, setCode] = useState(initialToken);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const confirm = useCallback(async (raw: string) => {
    const token = parseAdvanceCashTokenFromQr(raw) ?? normalizeAdvanceCashToken(raw);
    if (!token) {
      setError('Geçerli bir AVN- kodu okutun veya girin');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/personnel/advance-requests/confirm-cash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Onay kaydedilemedi');
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Onay kaydedilemedi');
    } finally {
      setSubmitting(false);
    }
  }, []);

  useEffect(() => {
    if (initialToken) void confirm(initialToken);
  }, [initialToken, confirm]);

  const handleScan = (text: string) => {
    if (submitting || success) return;
    void confirm(text);
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void confirm(code);
  };

  if (success) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#060d14] px-6 text-center text-white">
        <FiCheckCircle className="h-16 w-16 text-emerald-400" />
        <h1 className="mt-4 text-2xl font-bold">Nakit avans onaylandı</h1>
        <p className="mt-2 max-w-xs text-sm text-white/70">
          Teslim aldığınız kaydedildi. Avans maaşınızdan düşülecek.
        </p>
        <Link
          href="/personnel-panel/avans"
          className="mt-8 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white"
        >
          Avans taleplerim
        </Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] bg-[#060d14] text-white">
      <div className="absolute inset-x-0 top-0 z-20 flex items-center gap-3 px-4 safe-pt">
        <Link
          href="/personnel-panel/avans"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/45 backdrop-blur-md"
        >
          <FiArrowLeft />
        </Link>
        <div>
          <p className="text-sm font-semibold">Nakit avans onayı</p>
          <p className="text-xs text-white/60">Parayı aldıysanız QR okutun</p>
        </div>
      </div>

      {mode === 'scan' ? (
        <AttendanceQrScanner
          onScan={handleScan}
          disabled={submitting}
          parseQr={parseAdvanceCashTokenFromQr}
          invalidQrMessage="Geçerli bir avans QR kodu değil (AVN-)."
        />
      ) : (
        <form onSubmit={handleCodeSubmit} className="flex min-h-[100dvh] flex-col items-center justify-center px-6">
          <FiHash className="h-12 w-12 text-emerald-400" />
          <h2 className="mt-4 text-xl font-bold">AVN- kodu girin</h2>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="AVN-XXXXXXXXXXXX"
            className="mt-6 w-full max-w-xs rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-center font-mono text-lg tracking-wider"
            autoFocus
          />
          <button
            type="submit"
            disabled={submitting}
            className="mt-4 rounded-xl bg-emerald-500 px-8 py-3 text-sm font-semibold disabled:opacity-60"
          >
            {submitting ? 'Kaydediliyor…' : 'Onayla'}
          </button>
        </form>
      )}

      {error && (
        <div className="safe-pb-nav fixed inset-x-4 bottom-24 z-30 rounded-xl bg-red-500/90 px-4 py-3 text-center text-sm text-white">
          {error}
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={() => setMode(mode === 'scan' ? 'code' : 'scan')}
          className="flex-1 rounded-xl bg-white/10 py-3 text-sm font-semibold backdrop-blur-md"
        >
          {mode === 'scan' ? 'Kod gir' : 'QR okut'}
        </button>
      </div>
    </div>
  );
}

export default function AvansOnayPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center bg-[#060d14] text-white/70">
          Yükleniyor…
        </div>
      }
    >
      <AvansOnayContent />
    </Suspense>
  );
}
