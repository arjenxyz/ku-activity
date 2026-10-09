import type { GuideHighlight } from '@/lib/admin/live-guide/types';
import { hlClass } from '../highlight';

type Props = { highlight?: GuideHighlight; pulse?: boolean };

const ROWS = [
  { no: 'ABN-0142', name: 'Ayşe Yılmaz', pay: 'Ödendi' },
  { no: 'ABN-0143', name: 'Mehmet Kaya', pay: 'Bekliyor' },
  { no: 'ABN-0144', name: 'Zeynep Demir', pay: 'Ödendi' },
];

export function MockParticipants({ highlight, pulse }: Props) {
  return (
    <div className="space-y-2" aria-hidden>
      <p className="text-sm font-semibold text-[#0E1548]">Katılımcılar</p>
      <ul className="space-y-1.5">
        {ROWS.map((row, i) => (
          <li
            key={row.no}
            className={`flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2 ${
              i === 0 ? hlClass('participant-row', highlight, pulse) : ''
            }`}
          >
            <span className="min-w-0">
              <span className="block text-xs font-semibold text-[#0E1548]">{row.name}</span>
              <span className="block text-[10px] text-slate-500">{row.no}</span>
            </span>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                row.pay === 'Ödendi'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-800'
              }`}
            >
              {row.pay}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
