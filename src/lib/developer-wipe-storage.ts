import { createAdminClient } from '@/utils/supabase/admin';
import {
  EMPLOYEE_PHOTOS_BUCKET,
  REGISTRATION_PHOTOS_BUCKET,
} from '@/lib/photo-storage';

async function listStoragePaths(bucket: string, folder = ''): Promise<string[]> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(bucket).list(folder, {
    limit: 200,
    sortBy: { column: 'name', order: 'asc' },
  });

  if (error || !data?.length) {
    return [];
  }

  const paths: string[] = [];

  for (const item of data) {
    const path = folder ? `${folder}/${item.name}` : item.name;
    if (item.metadata) {
      paths.push(path);
      continue;
    }
    const nested = await listStoragePaths(bucket, path);
    paths.push(...nested);
  }

  return paths;
}

async function emptyBucket(bucket: string): Promise<number> {
  const admin = createAdminClient();
  const paths = await listStoragePaths(bucket);
  if (paths.length === 0) return 0;

  let removed = 0;
  const chunkSize = 100;
  for (let i = 0; i < paths.length; i += chunkSize) {
    const chunk = paths.slice(i, i + chunkSize);
    const { error } = await admin.storage.from(bucket).remove(chunk);
    if (error) {
      console.error(`[wipe-storage] ${bucket}:`, error.message);
      continue;
    }
    removed += chunk.length;
  }
  return removed;
}

export async function wipeApplicationStorage(): Promise<{
  employeePhotos: number;
  registrationPhotos: number;
}> {
  const [employeePhotos, registrationPhotos] = await Promise.all([
    emptyBucket(EMPLOYEE_PHOTOS_BUCKET),
    emptyBucket(REGISTRATION_PHOTOS_BUCKET),
  ]);

  return { employeePhotos, registrationPhotos };
}
