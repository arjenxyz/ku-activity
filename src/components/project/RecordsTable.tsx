import type { ReactNode } from 'react';
import { cardClass } from './ui';
import strings from '@json/src/components/project/RecordsTable.json';

export type RecordColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  hideOnMobile?: boolean;
};

export function RecordsTable<T extends { id: string }>({
  columns,
  rows,
  emptyMessage = strings.defaultEmptyMessage,
  loading,
}: {
  columns: RecordColumn<T>[];
  rows: T[];
  emptyMessage?: string;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className={`${cardClass} p-8 text-center text-sm text-slate-500`}>{strings.loading}</div>
    );
  }

  if (!rows.length) {
    return (
      <div className={`${cardClass} p-8 text-center text-sm text-slate-500`}>{emptyMessage}</div>
    );
  }

  return (
    <div className={cardClass}>
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className="px-4 py-3 text-left font-medium text-slate-600 whitespace-nowrap"
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3 text-slate-800 whitespace-nowrap">
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sm:hidden divide-y divide-slate-100">
        {rows.map((row) => (
          <div key={row.id} className="p-4 space-y-2">
            {columns
              .filter((c) => !c.hideOnMobile)
              .map((c) => (
                <div key={c.key} className="flex justify-between gap-3 text-sm">
                  <span className="text-slate-500 shrink-0">{c.header}</span>
                  <span className="text-slate-900 text-right">{c.render(row)}</span>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
