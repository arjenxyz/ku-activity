import type { SupabaseClient } from '@supabase/supabase-js';

/** ZIP içeriği şema sürümü — yeni modül eklenince artırın */
export const LEGAL_DOSSIER_SCHEMA_VERSION = '1.1.0';

export type DossierExportType = 'admin' | 'personnel_self';

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
