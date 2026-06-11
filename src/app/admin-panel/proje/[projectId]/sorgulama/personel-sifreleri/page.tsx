'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { ProjectPageHeader } from '@/components/project/ProjectPageHeader';
import { EmployeeSelect } from '@/components/project/EmployeeSelect';
import { AlertBanner } from '@/components/project/AlertBanner';
import { cardClass, btnPrimary, labelClass, inputClass } from '@/components/project/ui';
import { useProjectEmployees } from '@/hooks/useProjectEmployees';
import { resetEmployeePin } from '@/lib/project-api';

export default function PersonelSifreleriPage() {
  const { projectId } = useParams() as { projectId: string };
  const { employees, loading: empLoading, error: empError } = useProjectEmployees(projectId);
  const [employeeId, setEmployeeId] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!employeeId || pin.length < 4) {
      setError('Personel seçin ve en az 4 haneli şifre girin.');
      return;
    }
    setLoading(true);
    try {
      await resetEmployeePin(projectId, employeeId, pin);
      const name = employees.find((e) => e.id === employeeId)?.name;
      setSuccess(`${name ?? 'Personel'} için şifre güncellendi.`);
      setPin('');
      setEmployeeId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Güncelleme başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <ProjectPageHeader
        title="Personel Şifreleri"
        description="Personel paneli giriş şifresini (PIN) sıfırlayın."
      />
      {empError && <AlertBanner type="error" message={empError} />}
      {error && <AlertBanner type="error" message={error} />}
      {success && <AlertBanner type="success" message={success} />}

      <form onSubmit={handleSubmit} className={`${cardClass} p-4 sm:p-6 max-w-lg`}>
        <div className="space-y-4">
          <EmployeeSelect
            employees={employees}
            value={employeeId}
            onChange={setEmployeeId}
          />
          <div>
            <label className={labelClass}>Yeni Şifre (PIN) *</label>
            <input
              type="password"
              className={inputClass}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              minLength={4}
              maxLength={12}
              autoComplete="new-password"
              placeholder="4-12 karakter"
              required
            />
          </div>
          <button type="submit" className={btnPrimary} disabled={loading || empLoading}>
            {loading ? 'Kaydediliyor…' : 'Şifreyi Güncelle'}
          </button>
        </div>
      </form>
    </div>
  );
}
