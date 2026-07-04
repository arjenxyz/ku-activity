'use client';


import { formatString } from '@/lib/strings/format';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { ProjectPageHeader } from '@/components/project/ProjectPageHeader';
import { AlertBanner } from '@/components/project/AlertBanner';
import { cardClass, btnPrimary, labelClass, inputClass, btnSecondary } from '@/components/project/ui';
import {
  PERSONNEL_PIN_LENGTH,
  sanitizePersonnelPinInput,
} from '@/lib/personnel-pin';

const initialForm = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  tc_kimlik: '',
  daily_wage: '',
  position: '',
  hire_date: dayjs().format('YYYY-MM-DD'),
  pin: '',
};

export default function NewEmployeePage() {

  const strings = useRegistryStrings('app/admin-panel/proje/[projectId]/new/page');
  const router = useRouter();
  const { projectId } = useParams() as { projectId?: string };
  const [form, setForm] = useState({ ...initialForm });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const next =
      name === 'pin' ? sanitizePersonnelPinInput(value ?? '') : (value ?? '');
    setForm({ ...form, [name]: next });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (
      !form.first_name.trim() ||
      !form.last_name.trim() ||
      !form.email ||
      !form.tc_kimlik ||
      !form.daily_wage ||
      !form.position ||
      !form.pin
    ) {
      setError(strings.requiredFieldsError);
      return;
    }
    if (!projectId) {
      setError(strings.invalidProjectId);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          firstName: form.first_name.trim(),
          lastName: form.last_name.trim(),
          email: form.email || undefined,
          phone: form.phone || undefined,
          dailyWage: Number(form.daily_wage),
          position: form.position,
          hireDate: form.hire_date,
          pin: form.pin,
          tcKimlik: form.tc_kimlik,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(strings.registerErrorPrefix + (data.error || res.statusText));
        return;
      }

      setSuccess(true);
      setForm({ ...initialForm });
      setTimeout(() => router.push(`/admin-panel/proje/${projectId}`), 1200);
    } catch {
      setError(strings.unexpectedError);
    } finally {
      setLoading(false);
    }
  };

  if (!projectId) {
    return <AlertBanner type="error" message={strings.projectIdNotFound} />;
  }

  return (
    <div>
      <ProjectPageHeader title={strings.pageTitle} description={strings.pageDescription} />
      {error && <AlertBanner type="error" message={error} />}
      {success && <AlertBanner type="success" message={strings.successRegistered} />}

      <form onSubmit={handleSubmit} className={`${cardClass} p-4 sm:p-6 max-w-xl`}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{strings.labelFirstName}</label>
              <input
                type="text"
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                className={inputClass}
                required
                autoComplete="given-name"
              />
            </div>
            <div>
              <label className={labelClass}>{strings.labelLastName}</label>
              <input
                type="text"
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                className={inputClass}
                required
                autoComplete="family-name"
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>{strings.labelEmail}</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className={inputClass}
              required
              autoComplete="off"
            />
            <p className="text-xs text-slate-500 mt-1">{strings.emailHint}</p>
          </div>
          <div>
            <label className={labelClass}>{strings.labelPhone}</label>
            <input type="tel" name="phone" value={form.phone} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{strings.labelTcKimlik}</label>
            <input
              type="text"
              name="tc_kimlik"
              value={form.tc_kimlik}
              onChange={(e) =>
                setForm({ ...form, tc_kimlik: e.target.value.replace(/\D/g, '').slice(0, 11) })
              }
              className={inputClass}
              inputMode="numeric"
              maxLength={11}
              required
            />
            <p className="text-xs text-slate-500 mt-1">{strings.tcKimlikHint}</p>
          </div>
          <div>
            <label className={labelClass}>{strings.labelDailyWage}</label>
            <input
              type="number"
              name="daily_wage"
              value={form.daily_wage}
              onChange={handleChange}
              className={inputClass}
              min={0}
              required
            />
          </div>
          <div>
            <label className={labelClass}>{strings.labelPosition}</label>
            <input type="text" name="position" value={form.position} onChange={handleChange} className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>{strings.labelHireDate}</label>
            <input type="date" name="hire_date" value={form.hire_date} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{strings.labelPin}</label>
            <input
              type="password"
              name="pin"
              value={form.pin}
              onChange={handleChange}
              className={inputClass}
              inputMode="numeric"
              maxLength={PERSONNEL_PIN_LENGTH}
              autoComplete="new-password"
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              {formatString(strings.pinHint, { pinLength: PERSONNEL_PIN_LENGTH })}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button type="submit" className={btnPrimary} disabled={loading}>
              {loading ? strings.saving : strings.saveButton}
            </button>
            <button type="button" className={btnSecondary} onClick={() => router.back()}>
              {strings.cancelButton}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
