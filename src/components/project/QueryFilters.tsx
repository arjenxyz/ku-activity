'use client';

import dayjs from 'dayjs';
import { labelClass, inputClass } from './ui';
import { EmployeeSelect } from './EmployeeSelect';
import strings from '@json/src/components/project/QueryFilters.json';

type Emp = { id: string; name: string; position?: string | null };

export function QueryFilters({
  employees,
  employeeId,
  onEmployeeChange,
  month,
  onMonthChange,
  showEmployee = true,
  showMonth = true,
}: {
  employees: Emp[];
  employeeId: string;
  onEmployeeChange: (id: string) => void;
  month: string;
  onMonthChange: (m: string) => void;
  showEmployee?: boolean;
  showMonth?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
      {showEmployee && (
        <EmployeeSelect
          employees={employees}
          value={employeeId}
          onChange={onEmployeeChange}
          required={false}
        />
      )}
      {showMonth && (
        <div>
          <label className={labelClass}>{strings.monthLabel}</label>
          <input
            type="month"
            className={inputClass}
            value={month}
            max={dayjs().format('YYYY-MM')}
            onChange={(e) => onMonthChange(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
