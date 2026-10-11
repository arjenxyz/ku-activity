'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';
import { ADMIN_DISCLAIMER, type PaymentClaim } from '@/lib/payments/types';
import { moneyTry } from '@/lib/demo/participants-ui';

function MatchBadge({
  ok,
  label,
  detail,
}: {
  ok: boolean;
  label: string;
  detail?: string | null;
}) {
  return (
    <span
      className={`rounded-lg px-2 py-1.5 text-xs font-medium ${
        ok ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
      }`}
    >
      {label}: {ok ? 'Eşleşti' : detail || 'Okunamadı'}
    </span>
  );
}

const CONFIDENCE_LABEL: Record<string, string> = {
  strong: 'Güçlü',
  partial: 'Kısmi',
  weak: 'Zayıf',
};

const METHOD_LABEL: Record<string, string> = {
  'pdf-text': 'PDF metin',
  ocr: 'OCR',
  empty: 'Metin yok',
};

export function AdminPaymentReviews({ eventId }: { eventId: string }) {
  const [claims, setClaims] = useState<PaymentClaim[]>([]);
  const [ready, setReady] = useState(false);
  const [ack, setAck] = useState<Record<string, boolean>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch(
      `/api/payments/claims?awaiting=1&eventId=${encodeURIComponent(eventId)}`
    );
    const payload = (await response.json().catch(() => null)) as { claims?: PaymentClaim[] } | null;
    setClaims(payload?.claims ?? []);
    setReady(true);
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function decide(claimId: string, approve: boolean) {
    if (approve && !ack[claimId]) {
      setError('Onay için sorumluluk metnini işaretleyin.');
      return;
    }
    setBusyId(claimId);
    setError(null);
    try {
      const response = await fetch('/api/payments/claims', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimId,
          approve,
          disclaimerAck: Boolean(ack[claimId]),
          reviewerId: 'demo-admin',
          reviewerName: 'Demo Admin',
          note: approve ? 'Hesap hareketi kontrol edildi' : 'Dekont yetersiz / kod yok',
        }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error ?? 'İşlem başarısız');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center gap-2">
        <Link
          href={`/admin/events/${eventId}`}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#0E1548]"
          aria-label="Çalışma alanına dön"
        >
          <FiArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-[#0E1548]">Havale incelemeleri</h1>
          <p className="text-xs text-slate-500">
            OCR ipuçlarıyla dekont incelemesi — elden ödemeler burada değildir.
          </p>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!ready ? (
        <p className="text-sm text-slate-500">Yükleniyor…</p>
      ) : claims.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
          Bekleyen havale talebi yok.
        </div>
      ) : (
        <ul className="space-y-4">
          {claims.map((claim) => (
            <li key={claim.id} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-[#0E1548]">{claim.participantName}</p>
                  <p className="text-xs text-slate-500">
                    {claim.registrationNo} · kod {claim.expectedCode}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#0E1548]">
                    {moneyTry(claim.expectedAmount)}
                  </p>
                  <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    {CONFIDENCE_LABEL[claim.confidence] ?? claim.confidence} ·{' '}
                    {METHOD_LABEL[claim.extractMethod] ?? claim.extractMethod}
                  </p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <MatchBadge
                  ok={claim.codeMatched}
                  label="Kod"
                  detail={claim.ocr.code}
                />
                <MatchBadge
                  ok={claim.amountMatched}
                  label="Tutar"
                  detail={
                    claim.ocr.amount != null ? moneyTry(claim.ocr.amount) : null
                  }
                />
                <MatchBadge
                  ok={Boolean(claim.ibanMatched)}
                  label="IBAN"
                  detail={claim.ocr.iban}
                />
              </div>

              <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
                <p className="font-semibold text-slate-500">OCR özeti</p>
                <p className="mt-1 font-mono text-[11px] leading-relaxed text-[#0E1548]">
                  Kod: {claim.ocr.code || '—'} · Tutar:{' '}
                  {claim.ocr.amount != null ? moneyTry(claim.ocr.amount) : '—'} · IBAN:{' '}
                  {claim.ocr.iban || '—'}
                </p>
                {claim.ocr.rawText ? (
                  <p className="mt-1.5 line-clamp-3 text-[11px] text-slate-500">
                    {claim.ocr.rawText}
                  </p>
                ) : null}
              </div>

              {claim.receiptDataUrl.startsWith('data:image') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={claim.receiptDataUrl}
                  alt="Dekont"
                  className="mt-3 max-h-48 w-full rounded-xl object-contain ring-1 ring-slate-100"
                />
              ) : (
                <p className="mt-3 text-xs text-slate-500">Dosya: {claim.receiptFileName}</p>
              )}

              <label className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-950">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={Boolean(ack[claim.id])}
                  onChange={(e) => setAck((prev) => ({ ...prev, [claim.id]: e.target.checked }))}
                />
                <span>{ADMIN_DISCLAIMER}</span>
              </label>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  disabled={busyId === claim.id}
                  onClick={() => void decide(claim.id, true)}
                  className="flex-1 rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Onayla
                </button>
                <button
                  type="button"
                  disabled={busyId === claim.id}
                  onClick={() => void decide(claim.id, false)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-60"
                >
                  Reddet
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
