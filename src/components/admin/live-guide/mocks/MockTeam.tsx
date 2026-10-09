import type { GuideHighlight } from '@/lib/admin/live-guide/types';
import { hlClass } from '../highlight';

type Props = { highlight?: GuideHighlight; pulse?: boolean };

export function MockTeam({ highlight, pulse }: Props) {
  return (
    <div className="space-y-3" aria-hidden>
      <p className="text-sm font-semibold text-[#0E1548]">Ekip ilanı</p>
      <div
        className={`rounded-2xl border border-slate-200 bg-white px-3 py-3 ${hlClass('team-opening', highlight, pulse)}`}
      >
        <p className="text-xs font-semibold text-[#0E1548]">Abana 2027 · Görevli</p>
        <p className="mt-1 text-[10px] text-slate-500">Açık · 3 başvuru</p>
      </div>
      <div
        className={`rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 ${hlClass('team-applicant', highlight, pulse)}`}
      >
        <p className="text-xs font-medium text-[#0E1548]">Elif Yıldız</p>
        <p className="text-[10px] text-slate-500">Rehberlik · Onayla / Reddet</p>
      </div>
    </div>
  );
}
