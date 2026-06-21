'use client';

import { useCallback, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { FiCopy, FiPlus, FiRefreshCw, FiUser, FiUsers } from 'react-icons/fi';
import { RegistrationQrCode } from '@/components/registration/RegistrationQrCode';
import { EmployeeSelect } from '@/components/project/EmployeeSelect';
import { formatDateTime } from '@/lib/format';
import {
  createAttendanceQr,
  createPersonalAttendanceCode,
  fetchAttendanceQr,
  type AttendanceQrPayload,
  type PersonalAttendanceAdminPayload,
} from '@/lib/project-api';
import { useProjectEmployees } from '@/hooks/useProjectEmployees';
import { btnPrimary, labelClass, inputClass, cardClass } from '@/components/project/ui';

type Props = {
  projectId: string;
};

export function AttendanceQrPanel({ projectId }: Props) {
  const { employees } = useProjectEmployees(projectId);
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [data, setData] = useState<AttendanceQrPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [catchUpEmployeeId, setCatchUpEmployeeId] = useState('');
  const [personalLoading, setPersonalLoading] = useState(false);
  const [personalResult, setPersonalResult] = useState<PersonalAttendanceAdminPayload | null>(null);
  const [personalCopied, setPersonalCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchAttendanceQr(projectId, date);
      setData(payload);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'QR yüklenemedi');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [projectId, date]);

  useEffect(() => {
    void load();
  }, [load]);

  const isToday = date === dayjs().format('YYYY-MM-DD');
  const activeToken = data?.qr?.token;

  useEffect(() => {
    if (!isToday || !activeToken) return;
    const timer = window.setInterval(() => void load(), 5000);
    return () => window.clearInterval(timer);
  }, [isToday, activeToken, load]);

  useEffect(() => {
    setPersonalResult(null);
  }, [date, catchUpEmployeeId]);

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    try {
      const payload = await createAttendanceQr(projectId, date);
      setData(payload);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'QR oluşturulamadı');
    } finally {
      setCreating(false);
    }
  };

  const handlePersonalCreate = async () => {
    if (!catchUpEmployeeId) {
      setError('Kişisel kod için personel seçin.');
      return;
    }
    setPersonalLoading(true);
    setError(null);
    try {
      const result = await createPersonalAttendanceCode(projectId, catchUpEmployeeId, date);
      setPersonalResult(result);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kişisel kod oluşturulamadı');
    } finally {
      setPersonalLoading(false);
    }
  };

  const copySessionCode = async () => {
    if (!data?.qr?.token) return;
    try {
      await navigator.clipboard.writeText(data.qr.token);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Kod kopyalanamadı');
    }
  };

  const copyPersonalCode = async () => {
    if (!personalResult?.personal.token) return;
    try {
      await navigator.clipboard.writeText(personalResult.personal.token);
      setPersonalCopied(true);
      window.setTimeout(() => setPersonalCopied(false), 2000);
    } catch {
      setError('Kod kopyalanamadı');
    }
  };

  return (
    <div className={`${cardClass} p-4 sm:p-6 mb-6 space-y-6`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Usta yoklama alanı (sıra QR)</h2>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">
            Personel sırayla usta QR&apos;ını okutur — her okutmada QR otomatik yenilenir. Kişisel
            kodlar personelin kendi uygulamasında; başkasına gönderilemez.
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
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading && !data ? (
        <div className="h-48 rounded-xl bg-slate-100 animate-pulse" />
      ) : data?.qr ? (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="shrink-0 flex flex-col items-center">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Sıra QR (YOK-)
            </p>
            <RegistrationQrCode value={data.qr.url} size={220} />

            <div className="mt-4 w-full max-w-[240px] text-center">
              <p className="text-xs text-slate-500 mb-1">Anlık sıra kodu</p>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <code className="flex-1 text-xs font-bold font-mono text-slate-700 tracking-wider break-all">
                  {data.qr.token}
                </code>
                <button
                  type="button"
                  onClick={() => void copySessionCode()}
                  className="shrink-0 p-1.5 rounded-lg text-slate-500 hover:bg-white"
                  title="Kopyala"
                >
                  <FiCopy className="w-4 h-4" />
                </button>
              </div>
              {copied && <p className="text-xs text-emerald-600 mt-1">Kopyalandı</p>}
            </div>

            {isToday && (
              <p className="mt-3 text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded-lg text-center">
                Günde bir kez açılır; her okutmada yenilenir.
              </p>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <FiUsers className="w-4 h-4 text-emerald-600" />
              <p className="text-sm font-semibold text-slate-800">
                Yoklama yapanlar ({data.checkIns.length})
              </p>
            </div>
            {data.checkIns.length === 0 ? (
              <p className="text-sm text-slate-500">Henüz kimse yoklama yapmadı.</p>
            ) : (
              <ul className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                {data.checkIns.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm bg-white"
                  >
                    <div className="min-w-0">
                      <span className="font-medium text-slate-800 truncate block">
                        {c.employee_name}
                      </span>
                      <span className="text-xs text-slate-400">
                        {c.source === 'personal' ? 'Kişisel kod' : 'Usta QR'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 shrink-0">
                      {formatDateTime(c.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
          <p className="text-sm text-slate-600 mb-4">
            {isToday
              ? 'Bugün için sıra QR henüz oluşturulmadı.'
              : `${dayjs(date).format('DD.MM.YYYY')} için aktif sıra QR yok.`}
          </p>
          {data?.canCreateNew && (
            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={creating}
              className={`${btnPrimary} inline-flex items-center gap-2`}
            >
              <FiPlus className="w-4 h-4" />
              {creating ? 'Oluşturuluyor…' : 'Sıra QR oluştur'}
            </button>
          )}
        </div>
      )}

      {!isToday && data?.qr && (
        <button
          type="button"
          onClick={() => void handleCreate()}
          disabled={creating}
          className={`${btnPrimary} inline-flex items-center gap-2`}
        >
          <FiPlus className="w-4 h-4" />
          {creating ? 'Oluşturuluyor…' : 'Yeni sıra QR (eski geçersiz olur)'}
        </button>
      )}

      <div className="pt-6 border-t border-slate-100">
        <div className="flex items-center gap-2 mb-2">
          <FiUser className="w-4 h-4 text-violet-600" />
          <h3 className="text-base font-semibold text-slate-900">Kişisel kod (unutulan yoklama)</h3>
        </div>
        <p className="text-sm text-slate-500 mb-4 max-w-xl">
          Seçili gün ve personel için <strong>PER-</strong> kodu oluşturun. Yalnızca o personelin
          hesabında çalışır; istediğiniz kadar yenileyebilirsiniz.
        </p>

        <div className="space-y-4 max-w-md">
          <EmployeeSelect
            employees={employees}
            value={catchUpEmployeeId}
            onChange={setCatchUpEmployeeId}
          />
          <button
            type="button"
            onClick={() => void handlePersonalCreate()}
            disabled={personalLoading || !catchUpEmployeeId}
            className={`${btnPrimary} inline-flex items-center gap-2`}
          >
            <FiPlus className="w-4 h-4" />
            {personalLoading ? 'Oluşturuluyor…' : 'Kişisel kod oluştur'}
          </button>
        </div>

        {personalResult && (
          <div className="mt-4 p-4 rounded-xl border border-violet-100 bg-violet-50/50 max-w-sm">
            <p className="text-sm font-medium text-slate-800">{personalResult.employee.name}</p>
            <div className="flex items-center gap-2 mt-2 rounded-lg border border-violet-200 bg-white px-3 py-2">
              <code className="flex-1 text-sm font-bold font-mono text-violet-900 break-all">
                {personalResult.personal.token}
              </code>
              <button
                type="button"
                onClick={() => void copyPersonalCode()}
                className="shrink-0 p-1.5 rounded-lg text-violet-600 hover:bg-violet-50"
              >
                <FiCopy className="w-4 h-4" />
              </button>
            </div>
            {personalCopied && <p className="text-xs text-emerald-600 mt-1">Kopyalandı</p>}
            <p className="text-xs text-slate-500 mt-2">
              Personel kendi uygulamasından bu kodu girebilir veya QR okutabilir.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
