import type { CalendarDay } from '@/lib/personnel-stats';

const WEEKDAYS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];

export function PersonnelCalendar({ days }: { days: CalendarDay[] }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
        <h2 className="font-semibold text-gray-900 dark:text-white">Puantaj Takvimi</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Yeşil: çift onaylı · Sarı: tek taraf onaylı · Gri: kayıt yok
        </p>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-[10px] font-medium text-gray-400 py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((cell, i) => {
            if (!cell.inMonth) {
              return <div key={`e-${i}`} className="aspect-square" />;
            }
            const hasWork = cell.workAmount > 0;
            const approved = cell.approved === true;
            const pending = cell.approved === false;
            const bg = !hasWork
              ? 'bg-gray-50 dark:bg-slate-900/50 text-gray-400'
              : approved
                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300'
                : pending
                  ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
                  : 'bg-blue-50 dark:bg-blue-900/30 text-blue-800';

            return (
              <div
                key={cell.date}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center text-center p-0.5 ${bg}`}
                title={cell.date}
              >
                <span className="text-xs font-semibold">{cell.day}</span>
                {hasWork && (
                  <span className="text-[9px] leading-tight mt-0.5">
                    {cell.workAmount === 1 ? '1g' : `${cell.workAmount}g`}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
