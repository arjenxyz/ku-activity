import { labelClass, inputClass } from './ui';
import strings from '@json/src/components/project/EmployeeSelect.json';

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
      <label className={labelClass}>
        {strings.label}
        {required ? strings.requiredSuffix : ''}
      </label>
      <select
        className={inputClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      >
        <option value="">{strings.selectPlaceholder}</option>
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
