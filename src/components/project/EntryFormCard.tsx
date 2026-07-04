'use client';

import { cardClass, btnPrimary, labelClass, inputClass } from './ui';
import { EmployeeSelect } from './EmployeeSelect';
import type { ProjectEmployee } from '@/lib/project-api';
import strings from '@json/src/components/project/EntryFormCard.json';

type Field = {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'textarea';
  required?: boolean;
  placeholder?: string;
  step?: string;
};

export function EntryFormCard({
  title,
  employees,
  fields,
  values,
  onChange,
  employeeId,
  onEmployeeChange,
  onSubmit,
  loading,
  submitLabel = strings.defaultSubmitLabel,
}: {
  title: string;
  employees: ProjectEmployee[];
  fields: Field[];
  values: Record<string, string>;
  onChange: (name: string, value: string) => void;
  employeeId: string;
  onEmployeeChange: (id: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading?: boolean;
  submitLabel?: string;
}) {
  return (
    <form onSubmit={onSubmit} className={`${cardClass} p-4 sm:p-6 mb-6`}>
      <h2 className="text-base font-semibold text-slate-900 mb-4">{title}</h2>
      <div className="space-y-4">
        <EmployeeSelect employees={employees} value={employeeId} onChange={onEmployeeChange} />
        {fields.map((f) => (
          <div key={f.name}>
            <label className={labelClass}>
              {f.label}
              {f.required !== false ? strings.requiredSuffix : ''}
            </label>
            {f.type === 'textarea' ? (
              <textarea
                className={`${inputClass} min-h-[80px] resize-y`}
                value={values[f.name] ?? ''}
                onChange={(e) => onChange(f.name, e.target.value)}
                placeholder={f.placeholder}
              />
            ) : (
              <input
                type={f.type}
                className={inputClass}
                value={values[f.name] ?? ''}
                onChange={(e) => onChange(f.name, e.target.value)}
                required={f.required !== false}
                placeholder={f.placeholder}
                step={f.step}
                min={f.type === 'number' ? '0' : undefined}
              />
            )}
          </div>
        ))}
        <button type="submit" className={btnPrimary} disabled={loading}>
          {loading ? strings.submitSaving : submitLabel}
        </button>
      </div>
    </form>
  );
}
