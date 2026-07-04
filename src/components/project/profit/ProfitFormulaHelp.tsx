'use client';

import { cardClass } from '@/components/project/ui';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';

export function ProfitFormulaHelp() {

  const strings = useRegistryStrings('components/project/profit/ProfitFormulaHelp');
  return (
    <details className={`${cardClass} group`}>
      <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between text-sm font-medium text-slate-700 hover:bg-slate-50">
        <span>{strings.title}</span>
        <span className="text-slate-400 group-open:rotate-180 transition-transform text-xs">▼</span>
      </summary>
      <div className="px-4 pb-4 pt-0 text-sm text-slate-600 space-y-3 border-t border-slate-100">
        <div className="rounded-lg bg-slate-50 p-3 font-mono text-xs sm:text-sm leading-relaxed">
          <p className="text-emerald-800 font-semibold">{strings.formulaProfit}</p>
          <p className="mt-2 text-slate-600">{strings.formulaShare}</p>
        </div>
        <ol className="list-decimal list-inside space-y-1.5 text-slate-600">
          {strings.steps.map((step) => (
            <li key={step.title}>
              <strong>{step.title}</strong> — {step.body}
            </li>
          ))}
        </ol>
        <p className="text-xs text-slate-500">{strings.footer}</p>
      </div>
    </details>
  );
}
