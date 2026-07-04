import { ADMIN_APP_ICON, PERSONNEL_APP_ICON } from '@/lib/brand';

export const APP_RELEASES_BUCKET = 'app-releases';

export const APP_RELEASE_TYPES = ['personnel', 'admin'] as const;
export type AppReleaseType = (typeof APP_RELEASE_TYPES)[number];

export const APP_RELEASE_STATUSES = ['pending', 'published', 'archived'] as const;
export type AppReleaseStatus = (typeof APP_RELEASE_STATUSES)[number];

export type AppReleaseRow = {
  id: string;
  app_type: AppReleaseType;
  version_name: string;
  version_code: number;
  storage_path: string;
  file_size: number;
  sha256: string | null;
  release_notes: string | null;
  status: AppReleaseStatus;
  uploaded_by: string | null;
  published_by: string | null;
  published_at: string | null;
  created_at: string;
};

export const APP_RELEASE_LABELS: Record<AppReleaseType, { title: string; description: string }> = {
  personnel: {
    title: 'Personel Uygulaması',
    description: 'Yoklama, yevmiye, mesai ve bordro görüntüleme.',
  },
  admin: {
    title: 'Yönetici Uygulaması',
    description: 'Proje yönetimi, personel onayı, yevmiye ve raporlar.',
  },
};

export const APP_RELEASE_ICONS: Record<AppReleaseType, string> = {
  personnel: PERSONNEL_APP_ICON,
  admin: ADMIN_APP_ICON,
};

export function appReleaseObjectPath(appType: AppReleaseType, versionCode: number, versionName: string) {
  const safeName = versionName.replace(/[^a-zA-Z0-9._-]+/g, '-');
  return `${appType}/${versionCode}-${safeName}.apk`;
}

export function formatApkFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

export function isValidAppReleaseType(value: string): value is AppReleaseType {
  return APP_RELEASE_TYPES.includes(value as AppReleaseType);
}
