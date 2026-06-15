'use client';

import { inputClass, labelClass } from '@/components/project/ui';
import type { ProjectPartner } from '@/types/project-job';
import { cardClass } from '@/components/project/ui';

type Props = {
  shareCount: string;
  onShareCountChange: (value: string) => void;
  onShareSave: () => void;
  saving?: boolean;
  partnerName: string;
  onPartnerNameChange: (value: string) => void;
  onAddPartner: (e: React.FormEvent) => void;
  partners: ProjectPartner[];
  onRemovePartner: (id: string) => void;
};

export function PartnerSettings({
  shareCount,
  onShareCountChange,
  onShareSave,
  saving,
  partnerName,
  onPartnerNameChange,
  onAddPartner,
  partners,
  onRemovePartner,
}: Props) {
  return (
    <details className={`${cardClass} group`}>
      <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between text-sm font-medium text-slate-700 hover:bg-slate-50">
        <span>Ortak paylaşımı ({shareCount} kişi)</span>
        <span className="text-slate-400 group-open:rotate-180 transition-transform text-xs">▼</span>
      </summary>
      <div className="px-4 pb-4 border-t border-slate-100 pt-4 space-y-4">
        <p className="text-xs text-slate-500">
          Siz dahil kaç kişi kârı eşit paylaşacak? Ortak adları yalnızca etiket içindir.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-32">
            <label className={labelClass}>Kişi sayısı</label>
            <select
              className={inputClass}
              value={shareCount}
              onChange={(e) => {
                onShareCountChange(e.target.value);
              }}
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n} kişi
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={onShareSave}
            disabled={saving}
            className="px-4 py-2.5 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-900 disabled:opacity-50"
          >
            Uygula
          </button>
        </div>
        <form onSubmit={onAddPartner} className="flex flex-wrap gap-2">
          <input
            className={`${inputClass} flex-1 min-w-[160px]`}
            placeholder="Ortak adı (isteğe bağlı)"
            value={partnerName}
            onChange={(e) => onPartnerNameChange(e.target.value)}
          />
          <button
            type="submit"
            disabled={saving || !partnerName.trim()}
            className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
          >
            Ekle
          </button>
        </form>
        {partners.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {partners.map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-1.5 text-sm bg-slate-100 text-slate-700 rounded-full pl-3 pr-1 py-1"
              >
                {p.name}
                <button
                  type="button"
                  className="text-slate-400 hover:text-red-600 text-xs px-2 py-0.5"
                  onClick={() => onRemovePartner(p.id)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}
