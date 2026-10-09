'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { FiArrowLeft, FiCopy, FiUpload } from 'react-icons/fi';
import { PAYMENT_STATUS_LABELS, type DemoParticipant } from '@/lib/demo/data';
import { moneyTry, paymentTone } from '@/lib/demo/participants-ui';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3 last:border-0">
      <dt className="shrink-0 text-xs text-slate-400">{label}</dt>
      <dd className="min-w-0 break-all text-right text-sm font-medium text-[#0E1548]">{value || '—'}</dd>
    </div>
  );
}

export function AdminParticipantDetail({
  eventId,
  registrationNo,
}: {
  eventId: string;
  registrationNo: string;
}) {
  const [row, setRow] = useState<DemoParticipant | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [cashToken, setCashToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch(
      `/api/payments/participants?eventId=${encodeURIComponent(eventId)}&registrationNo=${encodeURIComponent(registrationNo)}`
    );
    const payload = (await response.json().catch(() => null)) as {
      participant?: DemoParticipant;
      error?: string;
    } | null;
    setRow(payload?.participant ?? null);
    setReady(true);
  }, [eventId, registrationNo]);

  useEffect(() => {
    void load();
  }, [load]);

  async function uploadReceipt(file: File) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const form = new FormData();
      form.set('eventId', eventId);
      form.set('registrationNo', decodeURIComponent(registrationNo));
      form.set('receipt', file);
      const response = await fetch('/api/payments/claims', { method: 'POST', body: form });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        claim?: { codeMatched?: boolean; amountMatched?: boolean };
      } | null;
      if (!response.ok) throw new Error(payload?.error ?? 'Yükleme başarısız');
      const hints = [
        payload?.claim?.codeMatched ? 'Kod eşleşti' : 'Kod eşleşmedi / okunamadı',
        payload?.claim?.amountMatched ? 'Tutar eşleşti' : 'Tutar eşleşmedi / okunamadı',
      ].join(' · ');
      setMessage(`Dekont inceleme kuyruğuna alındı. ${hints}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata');
    } finally {
      setBusy(false);
    }
  }

  async function startCashHandoff() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch('/api/payments/cash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          eventId,
          registrationNo: decodeURIComponent(registrationNo),
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        handoff?: { token: string };
      } | null;
      if (!response.ok) throw new Error(payload?.error ?? 'QR oluşturulamadı');
      setCashToken(payload?.handoff?.token ?? null);
      setMessage('Elden teslim QR hazır — yetkili okusun. Admin onayı gerekmez.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata');
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return <p className="text-sm text-slate-500">Yükleniyor…</p>;
  }

  if (!row) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">Katılımcı bulunamadı.</p>
        <Link
          href={`/admin/participants/${eventId}`}
          className="text-sm font-medium text-[#2D6AF6] hover:underline"
        >
          Listeye dön
        </Link>
      </div>
    );
  }

  const canPay =
    row.paymentAmount > 0 &&
    row.paymentStatus !== 'paid' &&
    row.paymentStatus !== 'waived' &&
    row.paymentStatus !== 'claimed';

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-center gap-2">
        <Link
          href={`/admin/participants/${eventId}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#0E1548] hover:bg-slate-50"
          aria-label="Listeye dön"
        >
          <FiArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold text-[#0E1548]">{row.name}</h1>
          <p className="truncate text-xs text-slate-500">{row.registrationNo}</p>
        </div>
        <span
          className={`shrink-0 rounded-md px-2.5 py-1 text-[11px] font-semibold ${paymentTone(row.paymentStatus)}`}
        >
          {PAYMENT_STATUS_LABELS[row.paymentStatus]}
        </span>
      </div>

      {row.paymentAmount > 0 ? (
        <div className="rounded-2xl border border-[#2D6AF6]/20 bg-[#e8f0ff] px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#2D6AF6]">
            Havale açıklama kodu
          </p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="font-mono text-xl font-bold tracking-wide text-[#0E1548]">{row.paymentCode}</p>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1.5 text-xs font-medium text-[#0E1548] ring-1 ring-slate-200"
              onClick={() => void navigator.clipboard.writeText(row.paymentCode)}
            >
              <FiCopy className="h-3.5 w-3.5" />
              Kopyala
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-600">
            Öğrenci bu kodu havale açıklamasına yazmalı. Tutar: {moneyTry(row.paymentAmount)}
          </p>
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-1 shadow-sm">
        <dl>
          <DetailRow label="Öğrenci no" value={row.studentNo} />
          <DetailRow label="Bölüm" value={row.department} />
          <DetailRow label="Sınıf" value={row.classYear} />
          <DetailRow label="Telefon" value={row.phone} />
          <DetailRow label="E-posta" value={row.email} />
          <DetailRow label="Etkinlik" value={row.event} />
          <DetailRow label="Kayıt tarihi" value={row.registeredAt} />
          <DetailRow label="Katılım" value={`${row.attendance}${row.day ? ` · ${row.day}` : ''}`} />
          <DetailRow label="Ücret" value={moneyTry(row.paymentAmount)} />
          <DetailRow label="Ödenen" value={moneyTry(row.paidAmount)} />
          <DetailRow label="Yöntem" value={row.paymentMethod || '—'} />
          <DetailRow label="Sorumlu yetkili" value={row.custodianName ?? '—'} />
          <DetailRow label="Not" value={row.paymentNote} />
        </dl>
      </div>

      {canPay ? (
        <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-[#0E1548]">Ödeme bildir</p>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100">
            <FiUpload className="h-4 w-4" />
            {busy ? 'Yükleniyor…' : 'Havale dekontu yükle'}
            <input
              type="file"
              accept="image/*,.pdf,text/plain"
              className="hidden"
              disabled={busy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadReceipt(file);
                e.target.value = '';
              }}
            />
          </label>
          <button
            type="button"
            disabled={busy}
            onClick={() => void startCashHandoff()}
            className="w-full rounded-xl bg-[#0E1548] px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            Elden ödeme QR oluştur
          </button>
          <p className="text-[11px] text-slate-500">
            Havale: admin incelemesi gerekir. Elden: yetkili QR okuyunca anında onaylanır; sorumluluk teslim alanda.
          </p>
        </div>
      ) : null}

      {cashToken ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
          <p className="text-xs font-semibold text-emerald-800">Elden teslim QR</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/qr?token=${encodeURIComponent(cashToken)}`}
            alt="Elden teslim QR"
            className="mx-auto mt-3 h-44 w-44 rounded-2xl bg-white p-2 shadow-sm"
          />
          <p className="mt-2 break-all font-mono text-[10px] text-emerald-900/70">{cashToken}</p>
          <Link
            href={`/staff/payments/cash?eventId=${encodeURIComponent(eventId)}&token=${encodeURIComponent(cashToken)}`}
            className="mt-3 inline-block text-xs font-medium text-emerald-800 underline"
          >
            Yetkili okuma sayfası
          </Link>
        </div>
      ) : null}

      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
