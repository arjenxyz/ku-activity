import type { GuideHighlight } from '@/lib/admin/live-guide/types';
import { hlClass } from '../highlight';

type Props = { highlight?: GuideHighlight; pulse?: boolean };

export function MockCustody({ highlight, pulse }: Props) {
  return (
    <div className="space-y-2" aria-hidden>
      <p className="text-sm font-semibold text-[#0E1548]">Kasa / yetkili devir</p>
      <div
        className={`rounded-2xl border border-slate-200 bg-white px-3 py-3 ${hlClass('custody-row', highlight, pulse)}`}
      >
        <p className="text-xs font-semibold text-[#0E1548]">Demo Admin → Görevli Elif</p>
        <p className="mt-1 text-[10px] text-slate-500">3.400 ₺ · Nakit kasa · Bugün 14:20</p>
        <p className="mt-2 text-[10px] text-emerald-700">Devir tamamlandı</p>
      </div>
    </div>
  );
}
