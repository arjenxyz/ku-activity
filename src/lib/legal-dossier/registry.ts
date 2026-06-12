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

export function getDossierCollectors(): DossierCollector[] {
  return [...collectors].sort((a, b) => a.order - b.order);
}
