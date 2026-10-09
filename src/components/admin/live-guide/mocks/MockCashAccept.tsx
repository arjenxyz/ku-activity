import { FiCamera } from 'react-icons/fi';
import type { GuideHighlight } from '@/lib/admin/live-guide/types';
import { hlClass } from '../highlight';

type Props = { highlight?: GuideHighlight; pulse?: boolean };

export function MockCashAccept({ highlight, pulse }: Props) {
  return (
    <div className="space-y-3" aria-hidden>
      <p className="text-sm font-semibold text-[#0E1548]">Elden teslim al</p>
      <div
        className={`flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 ${hlClass('cash-qr', highlight, pulse)}`}
      >
        <FiCamera className="h-8 w-8 text-[#2D6AF6]" />
        <p className="mt-2 text-xs font-medium text-[#0E1548]">Katılımcı QR’ını oku</p>
        <p className="mt-1 text-[10px] text-slate-500">Örnek: anında ödendi + kasa kaydı</p>
      </div>
    </div>
  );
}
