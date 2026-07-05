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

const HIDDEN_COLLECTOR_IDS = new Set(['extensions_placeholder']);

export function getDossierCollectors(
  exportType: 'admin' | 'personnel_self' | 'admin_project' = 'admin'
): DossierCollector[] {
  const sorted = [...collectors]
    .filter((c) => !HIDDEN_COLLECTOR_IDS.has(c.id))
    .sort((a, b) => a.order - b.order);
  if (exportType === 'admin_project') {
    return sorted.filter((c) => c.id !== 'closure_consent');
  }
  return sorted;
}

export function listDossierSectionCatalog(
  exportType: 'admin' | 'personnel_self' | 'admin_project' = 'personnel_self'
) {
  return getDossierCollectors(exportType).map((c) => ({ id: c.id, title: c.title }));
}
