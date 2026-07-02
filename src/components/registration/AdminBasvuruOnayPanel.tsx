'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { FiCheckCircle, FiSearch, FiZap } from 'react-icons/fi';
import { AlertBanner } from '@/components/project/AlertBanner';
import { ProjectPageHeader } from '@/components/project/ProjectPageHeader';
import { cardClass, btnPrimary, labelClass, inputClass } from '@/components/project/ui';
import {
  AdminBasvuruOnayModal,
  type RegistrationApprovalData,
} from '@/components/registration/AdminBasvuruOnayModal';
import { extractVerificationCode, registrationStatusMessage } from '@/lib/parse-registration-qr';

const QrCameraScanner = dynamic(
  () => import('@/components/registration/QrCameraScanner').then((m) => m.QrCameraScanner),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center py-12 gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        <p className="text-sm text-slate-500">Kamera modülü yükleniyor…</p>
      </div>
    ),
  }
);

type Props = {
  projectId: string;
};

export function AdminBasvuruOnayPanel({ projectId }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialKod = searchParams.get('kod') ?? '';

  const [projectName, setProjectName] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState(initialKod);
  const [registration, setRegistration] = useState<RegistrationApprovalData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const lastAutoLookupRef = useRef('');

  useEffect(() => {
    fetch(`/api/admin/projects/${projectId}`)
      .then((r) => r.json())
      .then((d) => setProjectName(d.project?.name ?? null))
      .catch(() => {});
  }, [projectId]);

  const openRegistration = useCallback((data: RegistrationApprovalData) => {
    setRegistration(data);
    setModalOpen(true);
    const statusMsg = registrationStatusMessage(data.status);
    if (statusMsg) setError(statusMsg);
  }, []);

  const closeModal = useCallback(() => {
    if (loading) return;
    setModalOpen(false);
    setRegistration(null);
  }, [loading]);

  const lookup = useCallback(
    async (kod: string) => {
      const normalized = extractVerificationCode(kod) ?? kod.trim().toUpperCase();
      if (!normalized) return;
      setLoading(true);
      setError(null);
      setSuccess(null);
      try {
        const res = await fetch(`/api/admin/registrations/lookup?kod=${encodeURIComponent(normalized)}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            res.status === 404
              ? 'Bu kod geçersiz veya sistemde kayıtlı değil. Personelin ekranındaki ARJ- kodunu kontrol edin.'
              : data.error || 'Bulunamadı'
          );
        }
        openRegistration(data.registration);
      } catch (e) {
        setRegistration(null);
        setModalOpen(false);
        setError(e instanceof Error ? e.message : 'Arama başarısız');
      } finally {
        setLoading(false);
      }
    },
    [openRegistration]
  );

  useEffect(() => {
    const code = extractVerificationCode(codeInput);
    if (!code || code === lastAutoLookupRef.current || loading) return;

    const timer = window.setTimeout(() => {
      lastAutoLookupRef.current = code;
      void lookup(code);
    }, 450);

    return () => window.clearTimeout(timer);
  }, [codeInput, loading, lookup]);

  const handleCodePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text');
    const code = extractVerificationCode(pasted);
    if (!code) return;
    e.preventDefault();
    setCodeInput(code);
    lastAutoLookupRef.current = code;
    void lookup(code);
  };

  const handleCodeChange = (raw: string) => {
    const upper = raw.toUpperCase();
    setCodeInput(upper);
    if (!upper.trim()) {
      lastAutoLookupRef.current = '';
      return;
    }
    const extracted = extractVerificationCode(upper);
    if (!extracted) {
      lastAutoLookupRef.current = '';
    }
  };

  useEffect(() => {
    if (initialKod) lookup(initialKod);
  }, [initialKod, lookup]);

  const handleApprove = async (payload: {
    position: string;
    dailyWage: number;
    hireDate: string;
  }) => {
    if (!registration) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/registrations/${registration.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          position: payload.position,
          dailyWage: payload.dailyWage,
          hireDate: payload.hireDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Onay başarısız');
      setModalOpen(false);
      setRegistration(null);
      setCodeInput('');
      lastAutoLookupRef.current = '';
      setSuccess(
        `${registration.firstName} ${registration.lastName} onaylandı. ${data.email} adresi ile giriş yapabilir — PIN bilgisini personele iletin.`
      );
      setTimeout(() => router.push(`/admin-panel/proje/${projectId}/list`), 1800);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Onay başarısız';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (
      !registration ||
      !confirm(
        'Başvuruyu reddetmek istediğinize emin misiniz? Kayıt, fotoğraf ve sözleşme onayları kalıcı olarak silinir; personel aynı bilgilerle yeniden başvurabilir.'
      )
    ) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/registrations/${registration.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      setModalOpen(false);
      setRegistration(null);
      setCodeInput('');
      lastAutoLookupRef.current = '';
      setSuccess('Başvuru reddedildi ve veritabanından silindi.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Red başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6 pb-8">
      <ProjectPageHeader
        title="Başvuru Onayı"
        description={
          projectName
            ? `${projectName} — QR okutun veya kod girin; başvuru bulununca onay penceresi açılır.`
            : 'QR okutun veya kod girin; başvuru bulununca onay penceresi açılır.'
        }
      />

      {error && <AlertBanner type="error" message={error} />}
      {success && <AlertBanner type="success" message={success} />}

      <section className={`${cardClass} overflow-hidden`}>
        <div className="px-4 sm:px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50/50">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/25">
              <FiZap className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Hızlı tarama</h2>
              <p className="text-sm text-slate-600 mt-0.5">
                Personelin bekleme ekranındaki QR kodu okutun. Eşleşme bulunursa onay formu otomatik
                açılır.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-5">
          <div className="overflow-hidden rounded-2xl border-2 border-slate-200 bg-slate-950 shadow-inner">
            <QrCameraScanner
              disabled={loading}
              onScan={(code) => {
                setCodeInput(code);
                lastAutoLookupRef.current = code;
                void lookup(code);
              }}
            />
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden>
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                veya kod ile
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="basvuru-kod" className={labelClass}>
              Başvuru kodu
            </label>
            <div className="mt-1.5 flex flex-col sm:flex-row gap-2">
              <input
                id="basvuru-kod"
                className={`${inputClass} flex-1 uppercase tracking-widest font-mono text-base sm:text-sm min-h-[48px]`}
                value={codeInput}
                onChange={(e) => handleCodeChange(e.target.value)}
                onPaste={handleCodePaste}
                placeholder="ARJ-XXXXXX"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => {
                  const code = extractVerificationCode(codeInput);
                  if (code) lastAutoLookupRef.current = code;
                  void lookup(codeInput);
                }}
                disabled={loading || !extractVerificationCode(codeInput)}
                className={`${btnPrimary} sm:min-w-[8rem] min-h-[48px] shrink-0 bg-blue-600 hover:bg-blue-700`}
              >
                <FiSearch className="w-4 h-4" />
                {loading ? 'Aranıyor…' : 'Bul'}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2 flex items-start gap-1.5">
              <FiCheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
              Kod tamamlanınca otomatik aranır. QR okunamazsa personelin ekranındaki{' '}
              <strong className="font-mono text-slate-700">ARJ-</strong> kodunu yazın.
            </p>
          </div>
        </div>
      </section>

      {loading && !modalOpen && (
        <div className="flex items-center justify-center gap-2 py-4 text-sm text-slate-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          Başvuru aranıyor…
        </div>
      )}

      <AdminBasvuruOnayModal
        open={modalOpen}
        registration={registration}
        projectName={projectName}
        loading={loading}
        onClose={closeModal}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      <p className="text-sm text-slate-500">
        <Link href={`/admin-panel/proje/${projectId}`} className="text-blue-700 hover:underline">
          ← Proje özetine dön
        </Link>
      </p>
    </div>
  );
}
