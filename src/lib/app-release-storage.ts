import { createHash } from 'crypto';
import { createAdminClient } from '@/utils/supabase/admin';
import {
  APP_RELEASES_BUCKET,
  appReleaseObjectPath,
  type AppReleaseType,
} from '@/lib/app-releases';

const ALLOWED_APK_TYPES = new Set(['application/vnd.android.package-archive', 'application/octet-stream']);
const MAX_APK_BYTES = 150 * 1024 * 1024;

export function sha256Hex(buffer: Buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

export async function uploadAppReleaseApk(params: {
  appType: AppReleaseType;
  versionName: string;
  versionCode: number;
  file: File;
}) {
  const { appType, versionName, versionCode, file } = params;

  if (!ALLOWED_APK_TYPES.has(file.type)) {
    throw new Error('Yalnızca APK dosyası yüklenebilir');
  }

  if (file.size > MAX_APK_BYTES) {
    throw new Error('APK en fazla 150 MB olabilir');
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const path = appReleaseObjectPath(appType, versionCode, versionName);
  const admin = createAdminClient();

  const { error: uploadError } = await admin.storage.from(APP_RELEASES_BUCKET).upload(path, buffer, {
    contentType: 'application/vnd.android.package-archive',
    upsert: false,
    cacheControl: '3600',
  });

  if (uploadError) {
    if (uploadError.message.includes('Bucket') || uploadError.message.includes('bucket')) {
      throw new Error('054_app_releases.sql çalıştırın');
    }
    if (uploadError.message.includes('already exists') || uploadError.message.includes('Duplicate')) {
      throw new Error('Bu sürüm kodu için APK zaten yüklü');
    }
    throw new Error(uploadError.message || 'APK yüklenemedi');
  }

  return {
    storagePath: path,
    fileSize: file.size,
    sha256: sha256Hex(buffer),
  };
}

export async function deleteAppReleaseApk(storagePath: string) {
  const admin = createAdminClient();
  const { error } = await admin.storage.from(APP_RELEASES_BUCKET).remove([storagePath]);
  if (error) {
    throw new Error(error.message || 'APK silinemedi');
  }
}

export async function signedAppReleaseDownloadUrl(storagePath: string, expiresInSeconds = 3600) {
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(APP_RELEASES_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds, {
      download: true,
    });

  if (error || !data?.signedUrl) {
    throw new Error(error?.message || 'İndirme bağlantısı oluşturulamadı');
  }

  return data.signedUrl;
}
