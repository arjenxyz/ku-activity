import { labelClass, inputClass } from './ui';

type Emp = { id: string; name: string; position?: string | null };

export function EmployeeSelect({
  employees,
  value,
  onChange,
  required = true,
}: {
  employees: Emp[];
  value: string;
  onChange: (id: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className={labelClass}>Personel{required ? ' *' : ''}</label>
      <select
        className={inputClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      >
        <option value="">Seçiniz...</option>
        {employees.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name}
            {e.position ? ` — ${e.position}` : ''}
          </option>
        ))}
      </select>
    </div>
  );
}
