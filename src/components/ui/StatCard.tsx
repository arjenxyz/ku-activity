import type { ReactNode } from 'react';

type StatCardProps = {
  title: string;
  value: string | number;
  icon?: ReactNode;
  color?: string;
};

/** Preserved CrewLedger StatCard visual — icon/color optional for foundation shells. */
export const StatCard = ({
  title,
  value,
  icon,
  color = 'bg-slate-100 text-[#0E1548]',
}: StatCardProps) => {
  return (
    <div className="rounded-xl bg-white p-4 shadow dark:bg-gray-800 dark:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</p>
        </div>
        {icon ? <div className={`rounded-full p-3 ${color}`}>{icon}</div> : null}
      </div>
    </div>
  );
};
