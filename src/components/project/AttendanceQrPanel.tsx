'use client';

import { useCallback, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { FiCheckCircle, FiPlay, FiRefreshCw, FiUsers } from 'react-icons/fi';
import { RegistrationQrCode } from '@/components/registration/RegistrationQrCode';
import { formatDateTime } from '@/lib/format';
import {
  completeAttendanceSession,
  fetchAttendanceQr,
  startAttendanceSession,
  type AttendanceQrPayload,
} from '@/lib/project-api';
import { btnPrimary, labelClass, inputClass, cardClass } from '@/components/project/ui';

type Props = {
  projectId: string;
};

export function AttendanceQrPanel({ projectId }: Props) {
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [data, setData] = useState<AttendanceQrPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  return (
    <div className={`${cardClass} p-4 sm:p-6 mb-6 space-y-6`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Günlük yoklama</h2>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">
            Yoklamayı başlatın, personel sırayla QR okutsun. Kim okuttuğu otomatik kaydedilir.
            Bitirince listedekilerin tam gün yevmiyesi yazılır.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-50"
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      <div className="max-w-xs">
        <label className={labelClass}>Tarih</label>
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

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && (
        <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
          {success}
        </p>
      )}

      {loading && !data ? (
        <div className="h-48 rounded-xl bg-slate-100 animate-pulse" />
      ) : isActive && data?.qr ? (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="shrink-0 flex flex-col items-center">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Yoklama devam ediyor
            </span>
            <RegistrationQrCode value={data.qr.url} size={280} />
            <p className="mt-3 text-xs text-slate-500 text-center max-w-[220px]">
              Her personel okutunca QR otomatik değişir — sıradaki okutabilir.
            </p>
          </div>

          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <FiUsers className="w-4 h-4 text-emerald-600" />
              <p className="text-sm font-semibold text-slate-800">
                Okutanlar ({data.checkIns.length})
              </p>
            </div>

            {data.checkIns.length === 0 ? (
              <p className="text-sm text-slate-500 mb-4">Henüz kimse okutmadı.</p>
            ) : (
              <ul className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto mb-4">
                {data.checkIns.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm bg-white"
                  >
                    <span className="font-medium text-slate-800 truncate">{c.employee_name}</span>
                    <span className="text-xs text-slate-500 shrink-0">
                      {formatDateTime(c.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <button
              type="button"
              onClick={() => void handleComplete()}
              disabled={acting}
              className={`${btnPrimary} hidden sm:inline-flex items-center justify-center gap-2 w-full sm:w-auto`}
            >
              <FiCheckCircle className="w-4 h-4" />
              {acting ? 'Kaydediliyor…' : 'Yoklamayı bitir — yevmiyeleri yaz'}
            </button>
          </div>
        </div>
      ) : isCompleted && data?.session ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5">
          <p className="text-sm font-semibold text-emerald-800 flex items-center gap-2">
            <FiCheckCircle className="w-5 h-5" />
            Yoklama tamamlandı
            {data.session.completed_at && (
              <span className="font-normal text-emerald-700">
                — {formatDateTime(data.session.completed_at)}
              </span>
            )}
          </p>
          <p className="text-sm text-emerald-700 mt-2">
            {data.checkIns.length} personel için tam gün yevmiye kaydedildi.
          </p>
          {data.checkIns.length > 0 && (
            <ul className="mt-4 divide-y divide-emerald-100 border border-emerald-100 rounded-xl overflow-hidden bg-white">
              {data.checkIns.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
                >
                  <span className="font-medium text-slate-800">{c.employee_name}</span>
                  <span className="text-xs text-emerald-600">✓ yevmiye yazıldı</span>
                </li>
              ))}
            </ul>
          )}
          {data.canStart && (
            <button
              type="button"
              onClick={() => void handleStart()}
              disabled={acting}
              className="mt-4 text-sm text-blue-700 hover:underline"
            >
              Yeniden yoklama başlat
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
          <p className="text-sm text-slate-600 mb-4">
            {dayjs(date).format('DD.MM.YYYY')} için yoklama başlatılmadı.
          </p>
          <button
            type="button"
            onClick={() => void handleStart()}
            disabled={acting}
            className={`${btnPrimary} inline-flex items-center gap-2`}
          >
            <FiPlay className="w-4 h-4" />
            {acting ? 'Başlatılıyor…' : 'Yoklamayı başlat'}
          </button>
        </div>
      )}
      {isActive && data?.qr && (
        <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] inset-x-0 z-30 sm:hidden px-4 pb-2">
          <button
            type="button"
            onClick={() => void handleComplete()}
            disabled={acting || !data.checkIns.length}
            className={`${btnPrimary} w-full flex items-center justify-center gap-2 py-3.5 text-base shadow-lg`}
          >
            <FiCheckCircle className="w-5 h-5" />
            {acting
              ? 'Kaydediliyor…'
              : `Bitir (${data.checkIns.length} kişi)`}
          </button>
        </div>
      )}
    </div>
  );
}
