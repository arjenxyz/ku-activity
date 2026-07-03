'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { PersonnelLoginLayout } from '@/components/personnel/PersonnelLoginLayout';
import {
  savePendingRegistration,
  type PendingRegistration,
} from '@/lib/registration-pending-storage';

function DogrulaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('k') ?? '';

  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');
  const [pending, setPending] = useState<PendingRegistration | null>(null);

  useEffect(() => {
    if (!token) {
      setState('error');
      setError('Geçersiz doğrulama bağlantısı.');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(
          `/api/public/contract-otp/confirm-link?k=${encodeURIComponent(token)}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Doğrulama başarısız');

        const saved: PendingRegistration = {
          verificationCode: data.verificationCode,
          approvalUrl: data.approvalUrl,
          reused: data.reused,
        };
        savePendingRegistration(saved);

        if (!cancelled) {
          setPending(saved);
          setState('success');
          setTimeout(() => {
            router.replace('/personnel-panel/basvuru');
          }, 1500);
        }
      } catch (err) {
        if (!cancelled) {
          setState('error');
          setError(err instanceof Error ? err.message : 'Doğrulama başarısız');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, router]);

  if (state === 'loading') {
    return (
      <PersonnelLoginLayout title="Doğrulanıyor…" subtitle="Başvurunuz gönderiliyor, lütfen bekleyin.">
        <div className="flex flex-col items-center py-16 gap-4">
          <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">E-posta bağlantınız doğrulanıyor…</p>
        </div>
      </PersonnelLoginLayout>
    );
  }

  if (state === 'error') {
    return (
      <PersonnelLoginLayout title="Doğrulama başarısız" subtitle="Bağlantı geçersiz veya süresi dolmuş olabilir.">
        <div className="space-y-6 text-center max-w-md mx-auto">
          <FiXCircle className="w-14 h-14 text-red-400 mx-auto" />
          <p className="text-sm text-red-100 bg-red-950/60 border border-red-500/40 rounded-xl px-4 py-3">{error}</p>
          <Link
            href="/personnel-panel/basvuru"
            className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Başvuru sayfasına dön
          </Link>
        </div>
      </PersonnelLoginLayout>
    );
  }

  return (
    <PersonnelLoginLayout title="Başvuru gönderildi" subtitle="Yönetici onay ekranına yönlendiriliyorsunuz…">
      <div className="space-y-6 text-center max-w-md mx-auto">
        <FiCheckCircle className="w-14 h-14 text-emerald-400 mx-auto" />
        <div className="rounded-xl bg-emerald-950/60 border border-emerald-500/40 px-4 py-3 text-sm text-emerald-100">
          E-posta doğrulandı ve başvurunuz alındı.
          {pending?.verificationCode && (
            <p className="mt-2 font-mono font-bold tracking-widest">{pending.verificationCode}</p>
          )}
        </div>
        <p className="text-xs text-slate-400">Birazdan onay bekleme ekranına geçeceksiniz…</p>
      </div>
    </PersonnelLoginLayout>
  );
}

export default function BasvuruDogrulaPage() {
  return (
    <Suspense
      fallback={
        <PersonnelLoginLayout title="Yükleniyor…" subtitle="">
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </PersonnelLoginLayout>
      }
    >
      <DogrulaContent />
    </Suspense>
  );
}
