import type { GuideHighlight } from '@/lib/admin/live-guide/types';
import { hlClass } from '../highlight';

type Props = { highlight?: GuideHighlight; pulse?: boolean };

export function MockAudit({ highlight, pulse }: Props) {
  return (
    <div className="space-y-2" aria-hidden>
      <p className="text-sm font-semibold text-[#0E1548]">Denetim kayıtları</p>
      <div
        className={`rounded-xl border border-slate-100 bg-white px-3 py-2 ${hlClass('audit-row', highlight, pulse)}`}
      >
        <p className="text-xs font-semibold text-[#0E1548]">Havale onaylandı</p>
        <p className="mt-0.5 text-[10px] text-slate-500">ABN-0143 · Demo Admin · 2 dk önce</p>
      </div>
      <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 opacity-70">
        <p className="text-xs font-medium text-slate-600">Check-in</p>
        <p className="mt-0.5 text-[10px] text-slate-400">ABN-0142 · 5 dk önce</p>
      </div>
    </div>
  );
}
