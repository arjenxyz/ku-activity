'use client';

import { useCallback, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import {
  FiCheckCircle,
  FiCopy,
  FiPlay,
  FiRefreshCw,
  FiTrash2,
  FiUserMinus,
  FiUsers,
  FiXCircle,
} from 'react-icons/fi';
import { RegistrationQrCode } from '@/components/registration/RegistrationQrCode';
import { formatDateTime } from '@/lib/format';
import {
  cancelAttendanceSession,
  completeAttendanceSession,
  fetchAttendanceQr,
  removeAttendanceCheckIn,
  startAttendanceSession,
  type AttendanceQrPayload,
} from '@/lib/project-api';
import { btnPrimary, labelClass, inputClass } from '@/components/project/ui';

type Props = {
  projectId: string;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

function copyText(text: string) {
  void navigator.clipboard?.writeText(text);
}

export function AttendanceQrPanel({ projectId }: Props) {
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [data, setData] = useState<AttendanceQrPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchAttendanceQr(projectId, date);
      setData(payload);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yüklenemedi');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [projectId, date]);

  useEffect(() => {
    void load();
  }, [load]);

  const isActive = data?.session?.status === 'active';
  const isCompleted = data?.session?.status === 'completed';
  const activeToken = data?.qr?.token;
  const checkInCount = data?.checkIns.length ?? 0;

  useEffect(() => {
    if (!isActive || !activeToken) return;
    const timer = window.setInterval(() => void load(), 4000);
    return () => window.clearInterval(timer);
  }, [isActive, activeToken, load]);

  const handleStart = async () => {
    setActing(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = await startAttendanceSession(projectId, date);
      setData(payload);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Oturum başlatılamadı');
    } finally {
      setActing(false);
    }
  };

  const handleComplete = async () => {
    if (!data?.checkIns.length) {
      setError('Listede kimse yok. Yoklamayı bitirmeden önce en az bir personel okutmalı.');
      return;
    }
    if (!window.confirm(`${data.checkIns.length} personel için tam gün yevmiye yazılsın mı?`)) {
      return;
    }
    setActing(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = await completeAttendanceSession(projectId, date);
      setData(payload);
      setSuccess(payload.message ?? 'Yoklama tamamlandı.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yoklama bitirilemedi');
    } finally {
      setActing(false);
    }
  };

  const handleCancel = async () => {
    if (
      !window.confirm(
        'Yoklama iptal edilecek. Listeye eklenenler için yevmiye yazılmayacak. Emin misiniz?'
      )
    ) {
      return;
    }
    setActing(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = await cancelAttendanceSession(projectId, date);
      setData(payload);
      setSuccess(payload.message ?? 'Yoklama iptal edildi.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'İptal edilemedi');
    } finally {
      setActing(false);
    }
  };

  const handleRemoveCheckIn = async (checkInId: string, name: string) => {
    if (!window.confirm(`${name} listeden kaldırılsın mı?`)) return;
    setRemovingId(checkInId);
    setError(null);
    try {
      await removeAttendanceCheckIn(projectId, checkInId);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kaldırılamadı');
    } finally {
      setRemovingId(null);
    }
  };

  const handleCopyCode = () => {
    if (!data?.qr?.token) return;
    copyText(data.qr.token);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const formattedDate = dayjs(date).format('DD MMMM YYYY');

  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 px-4 py-5 sm:px-6 sm:py-6 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_55%)]" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-emerald-100/90 text-xs font-medium uppercase tracking-wider">
              Günlük yoklama
            </p>
            <h2 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight">QR ile devam</h2>
            <p className="mt-2 text-sm text-emerald-50/90 max-w-lg leading-relaxed">
              Başlatın, personel sırayla okutsun. Bitirince tam gün yevmiye yazılır — mesai ayrı
              eklenir.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-medium backdrop-blur hover:bg-white/20 disabled:opacity-50 transition-colors"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </button>
        </div>

        {/* Stats row */}
        <div className="relative mt-5 grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-xl bg-white/10 px-3 py-2.5 backdrop-blur">
            <p className="text-[10px] sm:text-xs text-emerald-100/80 uppercase tracking-wide">
              Tarih
            </p>
            <p className="text-sm sm:text-base font-semibold truncate">{formattedDate}</p>
          </div>
          <div className="rounded-xl bg-white/10 px-3 py-2.5 backdrop-blur">
            <p className="text-[10px] sm:text-xs text-emerald-100/80 uppercase tracking-wide">
              Durum
            </p>
            <p className="text-sm sm:text-base font-semibold">
              {loading && !data
                ? '…'
                : isActive
                  ? 'Devam ediyor'
                  : isCompleted
                    ? 'Tamamlandı'
                    : 'Başlamadı'}
            </p>
          </div>
          <div className="rounded-xl bg-white/10 px-3 py-2.5 backdrop-blur">
            <p className="text-[10px] sm:text-xs text-emerald-100/80 uppercase tracking-wide">
              Okutan
            </p>
            <p className="text-sm sm:text-base font-semibold">{checkInCount} kişi</p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-5">
        <div className="max-w-xs">
          <label className={labelClass}>Yoklama tarihi</label>
          <input
            type="date"
            className={inputClass}
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setSuccess(null);
            }}
            disabled={isActive}
          />
        </div>

        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            {error}
          </p>
        )}
        {success && (
          <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
            {success}
          </p>
        )}

        {loading && !data ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="h-72 rounded-2xl bg-slate-100 animate-pulse" />
            <div className="h-72 rounded-2xl bg-slate-100 animate-pulse" />
          </div>
        ) : isActive && data?.qr ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,280px)_1fr]">
            {/* QR column */}
            <div className="flex flex-col items-center">
              <div className="relative w-full max-w-[300px]">
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-emerald-400/30 to-teal-500/20 blur-sm" />
                <div className="relative rounded-2xl border-2 border-emerald-200 bg-white p-4 shadow-md">
                  <span className="mb-3 flex items-center justify-center gap-2 text-xs font-semibold text-emerald-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Sıradaki okutma
                  </span>
                  <RegistrationQrCode value={data.qr.url} size={240} />
                </div>
              </div>

              <div className="mt-4 w-full max-w-[300px] space-y-2">
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <code className="flex-1 text-xs font-mono font-semibold text-slate-700 truncate">
                    {data.qr.token}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-white hover:text-emerald-600 transition-colors"
                    title="Kodu kopyala"
                  >
                    <FiCopy className="w-4 h-4" />
                  </button>
                </div>
                {copied && (
                  <p className="text-xs text-center text-emerald-600 font-medium">Kopyalandı</p>
                )}
                <p className="text-xs text-center text-slate-500 leading-relaxed">
                  Her okutma sonrası QR otomatik yenilenir — personel sırayla okutur.
                </p>
              </div>
            </div>

            {/* List column */}
            <div className="flex min-w-0 flex-col">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FiUsers className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base font-semibold text-slate-900">
                    Okutanlar
                    <span className="ml-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-emerald-100 px-2 text-xs font-bold text-emerald-800">
                      {checkInCount}
                    </span>
                  </h3>
                </div>
              </div>

              {checkInCount === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-12 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <FiUsers className="w-7 h-7" />
                  </div>
                  <p className="mt-4 text-sm font-medium text-slate-700">Henüz kimse okutmadı</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Personel telefonundan yoklama sayfasını açıp QR okutmalı.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm max-h-[min(420px,50vh)] overflow-y-auto">
                  {data.checkIns.map((c, i) => (
                    <li
                      key={c.id}
                      className="flex items-center gap-3 px-3 py-3 sm:px-4 hover:bg-slate-50/80 transition-colors"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
                        {initials(c.employee_name) || String(i + 1)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {c.employee_name}
                        </p>
                        <p className="text-xs text-slate-500">{formatDateTime(c.created_at)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleRemoveCheckIn(c.id, c.employee_name)}
                        disabled={removingId === c.id || acting}
                        className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40 transition-colors"
                        title="Listeden kaldır"
                        aria-label={`${c.employee_name} kaldır`}
                      >
                        <FiUserMinus className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4 hidden sm:flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void handleComplete()}
                  disabled={acting || !checkInCount}
                  className={`${btnPrimary} inline-flex items-center gap-2`}
                >
                  <FiCheckCircle className="w-4 h-4" />
                  {acting ? 'Kaydediliyor…' : 'Yoklamayı bitir'}
                </button>
                <button
                  type="button"
                  onClick={() => void handleCancel()}
                  disabled={acting}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  <FiXCircle className="w-4 h-4" />
                  İptal et
                </button>
              </div>
            </div>
          </div>
        ) : isCompleted && data?.session ? (
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/50 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                <FiCheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-base font-semibold text-emerald-900">Yoklama tamamlandı</p>
                {data.session.completed_at && (
                  <p className="text-sm text-emerald-700 mt-0.5">
                    {formatDateTime(data.session.completed_at)}
                  </p>
                )}
                <p className="text-sm text-emerald-800 mt-2">
                  {checkInCount} personel için tam gün yevmiye kaydedildi.
                </p>
              </div>
            </div>

            {checkInCount > 0 && (
              <ul className="mt-5 divide-y divide-emerald-100 overflow-hidden rounded-xl border border-emerald-100 bg-white">
                {data.checkIns.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                  >
                    <span className="font-medium text-slate-800">{c.employee_name}</span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                      <FiCheckCircle className="w-3.5 h-3.5" />
                      Yevmiye yazıldı
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {data.canStart && (
              <button
                type="button"
                onClick={() => void handleStart()}
                disabled={acting}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                <FiPlay className="w-4 h-4" />
                Yeniden başlat
              </button>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 sm:py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-100">
              <FiPlay className="w-8 h-8 text-emerald-600" />
            </div>
            <p className="mt-5 text-base font-semibold text-slate-800">
              {formattedDate} için yoklama yok
            </p>
            <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
              Başlattığınızda QR oluşur; personel okudukça listeye eklenir.
            </p>
            <button
              type="button"
              onClick={() => void handleStart()}
              disabled={acting}
              className={`${btnPrimary} mt-6 inline-flex items-center gap-2 px-6 py-3 text-base`}
            >
              <FiPlay className="w-5 h-5" />
              {acting ? 'Başlatılıyor…' : 'Yoklamayı başlat'}
            </button>
          </div>
        )}
      </div>

      {/* Mobile sticky actions */}
      {isActive && data?.qr && (
        <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] inset-x-0 z-30 sm:hidden px-4 pb-2">
          <div className="flex gap-2 rounded-2xl bg-white/95 p-2 shadow-xl ring-1 ring-slate-200/80 backdrop-blur">
            <button
              type="button"
              onClick={() => void handleCancel()}
              disabled={acting}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-red-200 text-red-600 disabled:opacity-50"
              aria-label="İptal et"
            >
              <FiTrash2 className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => void handleComplete()}
              disabled={acting || !checkInCount}
              className={`${btnPrimary} flex-1 flex items-center justify-center gap-2 py-3 text-base`}
            >
              <FiCheckCircle className="w-5 h-5" />
              {acting ? 'Kaydediliyor…' : `Bitir (${checkInCount})`}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
