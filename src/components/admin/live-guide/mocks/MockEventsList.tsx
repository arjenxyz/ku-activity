import { FiMapPin } from 'react-icons/fi';
import type { GuideHighlight } from '@/lib/admin/live-guide/types';
import { hlClass } from '../highlight';

type Props = { highlight?: GuideHighlight; pulse?: boolean };

export function MockEventsList({ highlight, pulse }: Props) {
  return (
    <div className="space-y-3" aria-hidden>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-[#0E1548]">Etkinlikler</p>
        <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-500">
          Filtre
        </span>
      </div>
      <div className={`rounded-2xl border border-slate-200 bg-white p-3 ${hlClass('event-card', highlight, pulse)}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#0E1548]">Abana 2027</p>
            <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
              <FiMapPin className="h-3 w-3 text-[#2D6AF6]" />
              Kastamonu · 12–14 Haz
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-[#e8f0ff] px-2 py-0.5 text-[10px] font-medium text-[#2D6AF6]">
            Kayıt açık
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span
            className={`inline-flex rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-[#0E1548] ${hlClass('event-edit-btn', highlight, pulse)}`}
          >
            Düzenle
          </span>
          <span
            className={`inline-flex rounded-lg bg-[#0E1548] px-2.5 py-1 text-[11px] font-medium text-white ${hlClass('event-details', highlight, pulse)}`}
          >
            Etkinlik Detayları
          </span>
        </div>
      </div>
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-3 py-3 opacity-60">
        <p className="text-xs font-medium text-slate-500">Kapadokya Gezisi</p>
        <p className="mt-0.5 text-[10px] text-slate-400">Taslak</p>
      </div>
    </div>
  );
}
