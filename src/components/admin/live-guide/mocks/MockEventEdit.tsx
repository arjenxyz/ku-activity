import type { GuideHighlight } from '@/lib/admin/live-guide/types';
import { hlClass } from '../highlight';

type Props = { highlight?: GuideHighlight; pulse?: boolean };

export function MockEventEdit({ highlight, pulse }: Props) {
  return (
    <div className="space-y-3" aria-hidden>
      <p className="text-sm font-semibold text-[#0E1548]">Etkinlik düzenle</p>
      <label className={`block ${hlClass('edit-title', highlight, pulse)}`}>
        <span className="text-[10px] font-medium text-slate-500">Başlık</span>
        <span className="mt-1 block rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-[#0E1548]">
          Abana 2027
        </span>
      </label>
      <label className={`block ${hlClass('edit-dates', highlight, pulse)}`}>
        <span className="text-[10px] font-medium text-slate-500">Tarihler</span>
        <span className="mt-1 block rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-[#0E1548]">
          12 Haz 2027 – 14 Haz 2027
        </span>
      </label>
    </div>
  );
}
