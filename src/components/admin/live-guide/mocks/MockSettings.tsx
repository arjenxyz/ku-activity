import type { GuideHighlight } from '@/lib/admin/live-guide/types';
import { hlClass } from '../highlight';

type Props = { highlight?: GuideHighlight; pulse?: boolean };

export function MockSettings({ highlight, pulse }: Props) {
  return (
    <div className="space-y-3" aria-hidden>
      <p className="text-sm font-semibold text-[#0E1548]">Ayarlar</p>
      <div
        className={`rounded-xl border border-slate-200 bg-white px-3 py-3 ${hlClass('settings-pref', highlight, pulse)}`}
      >
        <p className="text-xs font-medium text-[#0E1548]">Bildirim tercihleri</p>
        <p className="mt-1 text-[10px] text-slate-500">Demo hesap — gerçek kullanıcı oluşturmaz</p>
      </div>
      <p className="text-[10px] text-slate-500">
        Dil: üst çubuktaki bayrak · Çıkış: menüde Ayarlar’ın altı
      </p>
    </div>
  );
}
