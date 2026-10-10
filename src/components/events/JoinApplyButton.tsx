'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { CatalogEvent } from '@/lib/events/catalog';
import { emptyPlanning, formatFeeTry } from '@/lib/events/catalog';

type Props = {
  event: CatalogEvent;
  isStudent: boolean;
  registrationOpen: boolean;
  seatsLeft: number;
};

export function JoinApplyButton({ event, isStudent, registrationOpen, seatsLeft }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const planning = event.planning ?? emptyPlanning();
  const fee = planning.pricing.feeAmount;
  const hasFee = typeof fee === 'number' && fee > 0;

  async function apply() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          dayIds: event.days.map((day) => day.id),
          activityIds: [],
          logistics: {},
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        registration?: { id: string };
      } | null;
      if (!response.ok) {
        setError(payload?.error ?? 'Başvuru gönderilemedi');
        return;
      }
      setDone(true);
      router.refresh();
    } catch {
      setError('Başvuru gönderilemedi');
    } finally {
      setLoading(false);
    }
  }

  if (!isStudent) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
        <p className="text-sm text-slate-600">
          Katılım başvurusu için öğrenci hesabınla giriş yap.
        </p>
        <Link
          href="/login"
          className="mt-3 inline-flex h-11 items-center justify-center rounded-xl bg-[#0E1548] px-4 text-sm font-semibold text-white"
        >
          Giriş yap
        </Link>
      </div>
    );
  }

  if (!registrationOpen || seatsLeft <= 0) {
    return (
      <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Kayıt şu an kapalı veya kontenjan dolu.
      </p>
    );
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-4">
        <p className="text-sm font-semibold text-[#0E1548]">Başvurunuz alındı</p>
        {hasFee ? (
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Etkinlik ücreti {formatFeeTry(fee)}. Ödeme için{' '}
            <Link href="/kayitlarim" className="font-semibold text-[#2D6AF6] hover:underline">
              Etkinliklerim
            </Link>
            ’e gidin, bu etkinliği bulun ve <span className="font-semibold">Ücreti öde</span>{' '}
            bölümünü açın.
          </p>
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Bu etkinlik ücretsiz. Kayıtlarınızı{' '}
            <Link href="/kayitlarim" className="font-semibold text-[#2D6AF6] hover:underline">
              Etkinliklerim
            </Link>
            ’den takip edebilirsiniz.
          </p>
        )}
        <Link
          href="/kayitlarim"
          className="mt-4 flex h-11 w-full items-center justify-center rounded-xl bg-[#0E1548] text-sm font-semibold text-white"
        >
          Etkinliklerime git
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {hasFee ? (
        <p className="text-sm text-slate-600">
          Katılım ücreti {formatFeeTry(fee)}. Başvurudan sonra ödeme adımlarını Etkinliklerim’de
          göreceksiniz.
        </p>
      ) : null}
      <button
        type="button"
        disabled={loading}
        onClick={() => void apply()}
        className="flex h-11 w-full items-center justify-center rounded-xl bg-[#C70A2C] text-sm font-bold uppercase tracking-wide text-white hover:bg-[#A80824] disabled:opacity-70"
      >
        {loading ? 'Gönderiliyor…' : 'Katıl'}
      </button>
    </div>
  );
}
