import type { GuideHighlight } from '@/lib/admin/live-guide/types';
import { hlClass } from '../highlight';

type Props = { highlight?: GuideHighlight; pulse?: boolean };

const STATS = [
  { label: 'Kayıt', value: '84' },
  { label: 'Ödendi', value: '61' },
  { label: 'Check-in', value: '12' },
];

export function MockReports({ highlight, pulse }: Props) {
  return (
    <div className="space-y-3" aria-hidden>
      <p className="text-sm font-semibold text-[#0E1548]">Raporlar</p>
      <div className={`grid grid-cols-3 gap-2 ${hlClass('report-stat', highlight, pulse)}`}>
        {STATS.map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white px-2 py-3 text-center">
            <p className="text-lg font-semibold text-[#0E1548]">{s.value}</p>
            <p className="text-[10px] text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
