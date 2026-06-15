'use client';

import { cardClass } from '@/components/project/ui';

export function ProfitFormulaHelp() {
  return (
    <details className={`${cardClass} group`}>
      <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between text-sm font-medium text-slate-700 hover:bg-slate-50">
        <span>Nasıl hesaplanır?</span>
        <span className="text-slate-400 group-open:rotate-180 transition-transform text-xs">▼</span>
      </summary>
      <div className="px-4 pb-4 pt-0 text-sm text-slate-600 space-y-3 border-t border-slate-100">
        <div className="rounded-lg bg-slate-50 p-3 font-mono text-xs sm:text-sm leading-relaxed">
          <p className="text-emerald-800 font-semibold">Kâr = Alacak − Yevmiye − Avans − Kesinti − Malzeme</p>
          <p className="mt-2 text-slate-600">Ortak başı = Kâr ÷ kişi sayısı</p>
        </div>
        <ol className="list-decimal list-inside space-y-1.5 text-slate-600">
          <li>
            <strong>İş kalemi ekleyin</strong> — üst taşerondan aldığınız birim fiyat × miktar (ör. 100 ₺/m² ×
            890)
          </li>
          <li>
            <strong>Giderleri bağlayın</strong> — yevmiye, avans ve kesinti girerken iş kalemini seçin
          </li>
          <li>
            <strong>Malzeme ekleyin</strong> — iş kartındaki malzeme bölümünden (personeli etkilemez)
          </li>
          <li>
            <strong>Ortak sayısını</strong> ayarlayın — kâr eşit bölünür
          </li>
        </ol>
        <p className="text-xs text-slate-500">
          Personel paneli ve bordro normal çalışır; iş kalemi yalnızca sizin kâr tablonuz içindir.
        </p>
      </div>
    </details>
  );
}
