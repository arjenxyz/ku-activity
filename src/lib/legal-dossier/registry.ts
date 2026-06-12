import type { DossierCollector } from './types';

const collectors: DossierCollector[] = [];

/** Yeni hukuki dosya modülleri bu fonksiyonla kayıt olur */
export function registerDossierCollector(collector: DossierCollector) {
  const existing = collectors.findIndex((c) => c.id === collector.id);
  if (existing >= 0) {
    collectors[existing] = collector;
  } else {
    collectors.push(collector);
  }
}

export function getDossierCollectors(exportType: 'admin' | 'personnel_self' = 'admin'): DossierCollector[] {
  const sorted = [...collectors].sort((a, b) => a.order - b.order);
  if (exportType === 'personnel_self') {
    return sorted.filter((c) => c.id !== 'extensions_placeholder');
  }
  return sorted;
}
