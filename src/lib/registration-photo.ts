import { createAdminClient } from '@/utils/supabase/admin';
import {
  EMPLOYEE_PHOTOS_BUCKET,
  REGISTRATION_PHOTOS_BUCKET,
  employeePhotoObjectPath,
  otpDraftPhotoObjectPath,
  registrationPhotoObjectPath,
  signedRegistrationPhotoUrl,
} from '@/lib/photo-storage';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

function extForMime(mime: string) {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg';
}

export { registrationPhotoObjectPath as registrationPhotoPath };
export { otpDraftPhotoObjectPath as otpDraftPhotoPath };

export async function uploadOtpDraftPhoto(challengeId: string, file: File) {
  if (!ALLOWED.has(file.type)) {
    throw new Error('JPEG, PNG veya WebP yükleyin');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Fotoğraf en fazla 5 MB olabilir');
  }

  const ext = extForMime(file.type);
  const path = otpDraftPhotoObjectPath(challengeId, ext);
  const buffer = Buffer.from(await file.arrayBuffer());
  const admin = createAdminClient();

  const { error } = await admin.storage.from(REGISTRATION_PHOTOS_BUCKET).upload(path, buffer, {
    contentType: file.type,
    upsert: true,
    cacheControl: '3600',
  });

  if (error) {
    throw new Error(
      error.message.includes('Bucket') ? '025_private_photo_storage.sql çalıştırın' : 'Fotoğraf yüklenemedi'
    );
  }

  return path;
}

export async function deleteOtpDraftPhoto(draftPath: string | null) {
  if (!draftPath) return;
  const admin = createAdminClient();
  await admin.storage.from(REGISTRATION_PHOTOS_BUCKET).remove([draftPath]);
  await admin.storage.from(EMPLOYEE_PHOTOS_BUCKET).remove([draftPath]);
}

export async function deleteRegistrationPhoto(photoPath: string | null) {
  if (!photoPath) return;
  const admin = createAdminClient();
  await admin.storage.from(REGISTRATION_PHOTOS_BUCKET).remove([photoPath]);
  await admin.storage.from(EMPLOYEE_PHOTOS_BUCKET).remove([photoPath]);
}

export async function moveDraftPhotoToRegistration(draftPath: string, requestId: string) {
  const admin = createAdminClient();
  let blob: Blob | null = null;

  const primary = await admin.storage.from(REGISTRATION_PHOTOS_BUCKET).download(draftPath);
  if (!primary.error && primary.data) {
    blob = primary.data;
  } else {
    const legacy = await admin.storage.from(EMPLOYEE_PHOTOS_BUCKET).download(draftPath);
    if (legacy.error || !legacy.data) {
      throw new Error('Başvuru fotoğrafı bulunamadı. Lütfen yeniden başvurun.');
    }
    blob = legacy.data;
  }

  const ext = draftPath.split('.').pop() || 'jpg';
  const finalPath = registrationPhotoObjectPath(requestId, ext);
  const buffer = Buffer.from(await blob.arrayBuffer());
  const contentType =
    ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  const { error: upError } = await admin.storage.from(REGISTRATION_PHOTOS_BUCKET).upload(finalPath, buffer, {
    contentType,
    upsert: true,
    cacheControl: '3600',
  });

  if (upError) {
    throw new Error('Fotoğraf kaydedilemedi');
  }

  await deleteOtpDraftPhoto(draftPath);

  await admin
    .from('employee_registration_requests')
    .update({ photo_path: finalPath })
    .eq('id', requestId);

  return finalPath;
}

/** @deprecated publicPhotoUrl yerine signedRegistrationPhotoUrl kullanın */
export async function publicPhotoUrl(path: string) {
  return signedRegistrationPhotoUrl(path);
}

export async function uploadRegistrationPhoto(requestId: string, file: File) {
  if (!ALLOWED.has(file.type)) {
    throw new Error('JPEG, PNG veya WebP yükleyin');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Fotoğraf en fazla 5 MB olabilir');
  }

  const ext = extForMime(file.type);
  const path = registrationPhotoObjectPath(requestId, ext);
  const buffer = Buffer.from(await file.arrayBuffer());
  const admin = createAdminClient();

  const { error } = await admin.storage.from(REGISTRATION_PHOTOS_BUCKET).upload(path, buffer, {
    contentType: file.type,
    upsert: true,
    cacheControl: '3600',
  });

  if (error) {
    throw new Error(error.message.includes('Bucket') ? '025 migration çalıştırın' : 'Fotoğraf yüklenemedi');
  }

  await admin
    .from('employee_registration_requests')
    .update({ photo_path: path })
    .eq('id', requestId);

  return path;
}

export async function transferRegistrationPhotoToEmployee(
  photoPath: string | null,
  projectId: string,
  employeeId: string
): Promise<string | null> {
  if (!photoPath) return null;

  const admin = createAdminClient();
  let blob: Blob | null = null;

  const primary = await admin.storage.from(REGISTRATION_PHOTOS_BUCKET).download(photoPath);
  if (!primary.error && primary.data) {
    blob = primary.data;
  } else {
    const legacy = await admin.storage.from(EMPLOYEE_PHOTOS_BUCKET).download(photoPath);
    if (legacy.error || !legacy.data) return null;
    blob = legacy.data;
  }

  const ext = photoPath.split('.').pop() || 'jpg';
  const finalPath = employeePhotoObjectPath(projectId, employeeId, ext);
  const buffer = Buffer.from(await blob.arrayBuffer());
  const contentType =
    ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  const { error: upError } = await admin.storage.from(EMPLOYEE_PHOTOS_BUCKET).upload(finalPath, buffer, {
    contentType,
    upsert: true,
    cacheControl: '3600',
  });

  if (upError) return null;

  await admin.storage.from(REGISTRATION_PHOTOS_BUCKET).remove([photoPath]);
  await admin.storage.from(EMPLOYEE_PHOTOS_BUCKET).remove([photoPath]);

  await admin
    .from('employees')
    .update({ photo_path: finalPath, photo_url: null })
    .eq('id', employeeId);

  return finalPath;
}
