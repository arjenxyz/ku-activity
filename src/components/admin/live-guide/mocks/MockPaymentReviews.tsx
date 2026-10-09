import type { GuideHighlight } from '@/lib/admin/live-guide/types';
import { hlClass } from '../highlight';

type Props = { highlight?: GuideHighlight; pulse?: boolean };

export function MockPaymentReviews({ highlight, pulse }: Props) {
  return (
    <div className="space-y-2" aria-hidden>
      <p className="text-sm font-semibold text-[#0E1548]">Havale incelemeleri</p>
      <div className="rounded-2xl border border-slate-200 bg-white p-3">
        <p className="text-xs font-semibold text-[#0E1548]">Mehmet Kaya · ABN-0143</p>
        <p className="mt-1 text-[10px] text-slate-500">Dekont · TR12 · 1.250 ₺ · Bekliyor</p>
        <div className="mt-3 flex gap-2">
          <span
            className={`rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white ${hlClass('review-approve', highlight, pulse)}`}
          >
            Onayla
          </span>
          <span className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600">
            Reddet
          </span>
        </div>
      </div>
    </div>
  );
}
