'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { FiEye, FiEyeOff, FiRefreshCw } from 'react-icons/fi';
import { ProjectPageHeader } from '@/components/project/ProjectPageHeader';
import { EmployeeSelect } from '@/components/project/EmployeeSelect';
import { AlertBanner } from '@/components/project/AlertBanner';
import { cardClass, btnPrimary, btnSecondary, labelClass, inputClass } from '@/components/project/ui';
import { useProjectEmployees } from '@/hooks/useProjectEmployees';
import {
  fetchEmployeePins,
  resetEmployeePin,
  type EmployeePinRow,
} from '@/lib/project-api';
import {
  PERSONNEL_PIN_LENGTH,
  sanitizePersonnelPinInput,
  validatePersonnelPin,
} from '@/lib/personnel-pin';

export default function PersonelSifreleriPage() {
  const { projectId } = useParams() as { projectId: string };
  const { employees, loading: empLoading, error: empError } = useProjectEmployees(projectId);
  const [pinRows, setPinRows] = useState<EmployeePinRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  const loadPins = useCallback(async () => {
    setListLoading(true);
    try {
      const rows = await fetchEmployeePins(projectId);
      setPinRows(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'PIN listesi yüklenemedi');
    } finally {
      setListLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadPins();
  }, [loadPins]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!employeeId) {
      setError('Personel seçin.');
      return;
    }
    const pinError = validatePersonnelPin(pin);
    if (pinError) {
      setError(pinError);
      return;
    }
    setLoading(true);
    try {
      await resetEmployeePin(projectId, employeeId, pin);
      const name = employees.find((e) => e.id === employeeId)?.name;
      setSuccess(`${name ?? 'Personel'} için şifre güncellendi.`);
      setPin('');
      setEmployeeId('');
      await loadPins();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Güncelleme başarısız');
    } finally {
      setLoading(false);
    }
  };

  const visibleCount = pinRows.filter((r) => r.pinVisible).length;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <ProjectPageHeader
          title="Personel şifreleri"
          description="Mevcut giriş PIN'lerini görüntüleyin veya yeni PIN atayın."
        />
        <button
          type="button"
          onClick={() => loadPins()}
          disabled={listLoading}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <FiRefreshCw className={`w-4 h-4 ${listLoading ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      {empError && <AlertBanner type="error" message={empError} />}
      {error && <AlertBanner type="error" message={error} />}
      {success && <AlertBanner type="success" message={success} />}

      <section className={`${cardClass} overflow-hidden`}>
        <div className="px-4 py-3 sm:px-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900">Mevcut şifreler</h2>
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg hover:bg-slate-50"
          >
            {revealed ? <FiEyeOff className="w-3.5 h-3.5" /> : <FiEye className="w-3.5 h-3.5" />}
            {revealed ? 'Gizle' : 'PIN göster'}
          </button>
        </div>

        {listLoading ? (
          <p className="p-6 text-sm text-slate-500">Yükleniyor…</p>
        ) : pinRows.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Bu projede personel yok.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-2.5 font-semibold">Personel</th>
                  <th className="px-4 py-2.5 font-semibold">Durum</th>
                  <th className="px-4 py-2.5 font-semibold">Giriş PIN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pinRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-medium text-slate-900">{row.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          row.isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {row.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-800">
                      {!row.hasPin ? (
                        <span className="text-slate-400 font-sans text-xs">PIN yok</span>
                      ) : row.pinVisible && revealed ? (
                        row.pin
                      ) : row.pinVisible ? (
                        '••••••'
                      ) : (
                        <span className="text-amber-700 font-sans text-xs">
                          Eski kayıt — yeniden atayın
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!listLoading && pinRows.length > 0 && visibleCount < pinRows.filter((r) => r.hasPin).length && (
          <p className="px-4 py-3 text-xs text-slate-500 border-t border-slate-100 bg-slate-50/50">
            Eski personellerde PIN görünmeyebilir. Yeni PIN atayınca listede görünür.
          </p>
        )}
      </section>

      <form onSubmit={handleSubmit} className={`${cardClass} p-4 sm:p-6 max-w-lg`}>
        <h2 className="text-sm font-semibold text-slate-900 mb-4">PIN sıfırla</h2>
        <div className="space-y-4">
          <EmployeeSelect
            employees={employees}
            value={employeeId}
            onChange={setEmployeeId}
          />
          <div>
            <label className={labelClass}>Yeni şifre (PIN) *</label>
            <input
              type="password"
              className={inputClass}
              value={pin}
              onChange={(e) => setPin(sanitizePersonnelPinInput(e.target.value))}
              inputMode="numeric"
              maxLength={PERSONNEL_PIN_LENGTH}
              autoComplete="new-password"
              placeholder={`${PERSONNEL_PIN_LENGTH} haneli PIN`}
              required
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className={btnPrimary} disabled={loading || empLoading}>
              {loading ? 'Kaydediliyor…' : 'Şifreyi güncelle'}
            </button>
            <button
              type="button"
              className={btnSecondary}
              onClick={() => {
                setEmployeeId('');
                setPin('');
              }}
            >
              Temizle
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
