'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dayjs from 'dayjs';
import { FiCheck, FiShare2, FiUpload } from 'react-icons/fi';
import { AlertBanner } from '@/components/project/AlertBanner';
import { ProjectPageHeader } from '@/components/project/ProjectPageHeader';
import { cardClass, btnPrimary, btnSecondary, labelClass, inputClass } from '@/components/project/ui';
import { formatMoney } from '@/lib/format';
import { formatOcrIban } from '@/lib/advance-dekont-match';
import type { DekontMatchSuggestion } from '@/lib/advance-dekont-match';
import type { DekontOcrResult } from '@/lib/dekont-ocr';

type DraftPayload = {
  id: string;
  ocr_json: DekontOcrResult;
  match_json: DekontMatchSuggestion[];
  proof_file_name: string;
};

function confidenceLabel(c: DekontOcrResult['confidence']) {
  if (c === 'high') return 'Yüksek';
  if (c === 'medium') return 'Orta';
  return 'Düşük';
}

function DekontPaylasContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const draftId = searchParams.get('draft');
  const errorParam = searchParams.get('error');

  const [draft, setDraft] = useState<DraftPayload | null>(null);
  const [loading, setLoading] = useState(!!draftId);
  const [error, setError] = useState<string | null>(errorParam);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [paymentDate, setPaymentDate] = useState(dayjs().format('YYYY-MM-DD'));

  const loadDraft = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/dekont/drafts/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Taslak yüklenemedi');
      const d = data.draft as DraftPayload;
      setDraft(d);
      const top = (d.match_json ?? [])[0];
      if (top) {
        setSelectedRequestId(top.requestId);
        setSelectedProjectId(top.projectId);
      }
      if (d.ocr_json.referenceNo) setReferenceNo(d.ocr_json.referenceNo);
      if (d.ocr_json.paymentDate) setPaymentDate(d.ocr_json.paymentDate);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Taslak yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (draftId) void loadDraft(draftId);
  }, [draftId, loadDraft]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    setSuccess(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/admin/dekont/analyze', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analiz başarısız');
      router.replace(`/admin-panel/dekont-paylas?draft=${data.draftId}`);
      await loadDraft(data.draftId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analiz başarısız');
    } finally {
      setUploading(false);
    }
  };

  const handleConfirm = async () => {
    if (!draft || !selectedRequestId || !selectedProjectId) return;
    setConfirming(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/dekont/drafts/${draft.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: selectedRequestId,
          projectId: selectedProjectId,
          referenceNo,
          paymentDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kayıt başarısız');
      setSuccess('Ödeme kaydedildi — avans maaştan düşüldü.');
      setDraft(null);
      router.replace('/admin-panel/dekont-paylas');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kayıt başarısız');
    } finally {
      setConfirming(false);
    }
  };

  const matches = draft?.match_json ?? [];
  const ocr = draft?.ocr_json;

  return (
    <div>
      <ProjectPageHeader
        title="Dekont paylaş"
        description="Banka uygulamasından Paylaş → CrewLedger Yönetici ile dekont gönderin. OCR ile personel ve talep önerilir; siz onaylarsınız."
      />

      {error && <AlertBanner type="error" message={error} />}
      {success && <AlertBanner type="success" message={success} />}

      {!draft && !loading && (
        <div className={`${cardClass} max-w-xl space-y-4`}>
          <div className="flex items-start gap-3 rounded-xl bg-blue-50 p-4 text-sm text-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
            <FiShare2 className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Bankadan paylaş</p>
              <p className="mt-1 opacity-90">
                Garanti, Ziraat, İş Bankası vb. → Dekont → Paylaş → <strong>CrewLedger Yönetici</strong>
              </p>
              <p className="mt-2 text-xs opacity-75">
                Android APK/PWA güncel olmalı. Paylaş listesinde görünmüyorsa aşağıdan manuel yükleyin.
              </p>
            </div>
          </div>
          <div>
            <label className={labelClass}>Manuel dekont yükle</label>
            <input
              type="file"
              accept="application/pdf,image/*"
              className={inputClass}
              disabled={uploading}
              onChange={(e) => void handleFileUpload(e)}
            />
            {uploading && <p className="mt-2 text-sm text-slate-500">OCR analizi yapılıyor…</p>}
          </div>
        </div>
      )}

      {loading && <p className="py-12 text-center text-sm text-slate-500">Dekont analiz ediliyor…</p>}

      {draft && ocr && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className={cardClass}>
            <h3 className="font-semibold text-slate-900 dark:text-white">OCR sonucu</h3>
            <p className="mt-1 text-xs text-slate-500">{draft.proof_file_name}</p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Güven</dt>
                <dd>{confidenceLabel(ocr.confidence)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Alıcı IBAN</dt>
                <dd className="font-mono text-xs">{formatOcrIban(ocr.recipientIban)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Tutar</dt>
                <dd className="font-semibold tabular-nums">
                  {ocr.amount != null ? formatMoney(ocr.amount) : '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Referans</dt>
                <dd>{ocr.referenceNo ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Tarih</dt>
                <dd>{ocr.paymentDate ?? '—'}</dd>
              </div>
            </dl>
          </div>

          <div className={cardClass}>
            <h3 className="font-semibold">Eşleşen avans talebi</h3>
            <p className="mt-1 text-xs text-slate-500">Yarı otomatik — son onay sizde</p>

            {matches.length === 0 ? (
              <p className="mt-4 text-sm text-amber-700">
                Otomatik eşleşme bulunamadı. Avans talepleri sayfasından talebi elle seçip dekont yükleyin.
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {matches.map((m) => (
                  <li key={m.requestId}>
                    <label
                      className={`flex cursor-pointer flex-col rounded-xl border p-3 ${
                        selectedRequestId === m.requestId
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="match"
                        className="sr-only"
                        checked={selectedRequestId === m.requestId}
                        onChange={() => {
                          setSelectedRequestId(m.requestId);
                          setSelectedProjectId(m.projectId);
                        }}
                      />
                      <span className="font-medium">{m.employeeName}</span>
                      <span className="text-sm text-slate-500">
                        {m.projectName} · {formatMoney(m.approvedAmount)} · skor {m.score}
                      </span>
                      <span className="mt-1 text-xs text-slate-500">{m.reasons.join(' · ')}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 space-y-3">
              <div>
                <label className={labelClass}>Referans no</label>
                <input className={inputClass} value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Ödeme tarihi</label>
                <input
                  type="date"
                  className={inputClass}
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                className={btnPrimary}
                disabled={confirming || !selectedRequestId}
                onClick={() => void handleConfirm()}
              >
                <FiCheck className="mr-1 inline" /> Ödemeyi kaydet
              </button>
              <Link href={`/admin-panel/proje/${selectedProjectId}/avans-talepleri`} className={btnSecondary}>
                Avans talepleri
              </Link>
              <label className={`${btnSecondary} cursor-pointer`}>
                <FiUpload className="mr-1 inline" /> Başka dosya
                <input type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => void handleFileUpload(e)} />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DekontPaylasPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-sm text-slate-500">Yükleniyor…</div>}>
      <DekontPaylasContent />
    </Suspense>
  );
}
