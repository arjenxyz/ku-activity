import { FiCheck } from 'react-icons/fi';
import type { GuideHighlight } from '@/lib/admin/live-guide/types';
import { hlClass } from '../highlight';

type Props = { highlight?: GuideHighlight; pulse?: boolean };

export function MockCheckIn({ highlight, pulse }: Props) {
  return (
    <div className="space-y-3" aria-hidden>
      <p className="text-sm font-semibold text-[#0E1548]">Check-in</p>
      <div
        className={`rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-4 ${hlClass('checkin-scan', highlight, pulse)}`}
      >
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white">
            <FiCheck className="h-4 w-4" />
          </span>
          <span>
            <span className="block text-xs font-semibold text-emerald-900">Ayşe Yılmaz</span>
            <span className="block text-[10px] text-emerald-700">ABN-0142 · Giriş alındı</span>
          </span>
        </div>
      </div>
    </div>
  );
}
