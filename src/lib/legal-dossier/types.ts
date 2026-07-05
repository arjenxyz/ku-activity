import type { SupabaseClient } from '@supabase/supabase-js';

/** ZIP içeriği şema sürümü — yeni modül eklenince artırın */
export const LEGAL_DOSSIER_SCHEMA_VERSION = '1.2.0';

export const PROJECT_CLOSURE_CONSENT_VERSION = '2026-07-closure-v1';

export type DossierExportType = 'admin' | 'personnel_self' | 'admin_project';

export const PERSONNEL_SELF_EXPORT_DAILY_LIMIT = 5;

export type DossierFile = {
  path: string;
  content: string | Uint8Array;
};

export type DossierCollectorContext = {
  admin: SupabaseClient;
  projectId: string;
  employeeId: string;
  exportedAt: string;
  exportedByEmail: string;
  exportType: DossierExportType;
};

export type DossierCollector = {
  /** Benzersiz modül kimliği (gelecek özellikler buraya eklenir) */
  id: string;
  title: string;
  order: number;
  collect: (ctx: DossierCollectorContext) => Promise<DossierFile[]>;
};

export type LegalDossierResult = {
  employeeName: string;
  files: DossierFile[];
  sectionIds: string[];
  manifest: Record<string, unknown>;
};
