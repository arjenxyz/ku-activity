import { createAdminClient } from '@/utils/supabase/admin';

const BUCKET = 'employee-photos';
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

function extForMime(mime: string) {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg';
}

export function registrationPhotoPath(requestId: string, ext = 'jpg') {
  return `registrations/${requestId}.${ext}`;
}

export function otpDraftPhotoPath(challengeId: string, ext = 'jpg') {
  return `registrations/otp-drafts/${challengeId}.${ext}`;
}

export async function uploadOtpDraftPhoto(challengeId: string, file: File) {
  if (!ALLOWED.has(file.type)) {
    throw new Error('JPEG, PNG veya WebP yükleyin');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Fotoğraf en fazla 5 MB olabilir');
  }

  const ext = extForMime(file.type);
  const path = otpDraftPhotoPath(challengeId, ext);
  const buffer = Buffer.from(await file.arrayBuffer());
  const admin = createAdminClient();

  const { error } = await admin.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type,
    upsert: true,
    cacheControl: '3600',
  });

  if (error) {
    throw new Error(
      error.message.includes('Bucket') ? '012 veya 013 migration çalıştırın' : 'Fotoğraf yüklenemedi'
    );
  }

  return path;
}

export async function moveDraftPhotoToRegistration(draftPath: string, requestId: string) {
  const admin = createAdminClient();
  const { data: blob, error: dlError } = await admin.storage.from(BUCKET).download(draftPath);

  if (dlError || !blob) {
    throw new Error('Başvuru fotoğrafı bulunamadı. Lütfen yeniden başvurun.');
  }

  const ext = draftPath.split('.').pop() || 'jpg';
  const finalPath = registrationPhotoPath(requestId, ext);
  const buffer = Buffer.from(await blob.arrayBuffer());
  const contentType =
    ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  const { error: upError } = await admin.storage.from(BUCKET).upload(finalPath, buffer, {
    contentType,
    upsert: true,
    cacheControl: '3600',
  });

  if (upError) {
    throw new Error('Fotoğraf kaydedilemedi');
  }

  await admin.storage.from(BUCKET).remove([draftPath]);

  await admin
    .from('employee_registration_requests')
    .update({ photo_path: finalPath })
    .eq('id', requestId);

  return finalPath;
}

export function publicPhotoUrl(path: string) {
  const admin = createAdminClient();
  return admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function uploadRegistrationPhoto(requestId: string, file: File) {
  if (!ALLOWED.has(file.type)) {
    throw new Error('JPEG, PNG veya WebP yükleyin');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Fotoğraf en fazla 5 MB olabilir');
  }

  const ext = extForMime(file.type);
  const path = registrationPhotoPath(requestId, ext);
  const buffer = Buffer.from(await file.arrayBuffer());
  const admin = createAdminClient();

  const { error } = await admin.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type,
    upsert: true,
    cacheControl: '3600',
  });

  if (error) {
    throw new Error(error.message.includes('Bucket') ? '012 veya 013 migration çalıştırın' : 'Fotoğraf yüklenemedi');
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
  const { data: blob, error: dlError } = await admin.storage.from(BUCKET).download(photoPath);

  if (dlError || !blob) return null;

  const ext = photoPath.split('.').pop() || 'jpg';
  const finalPath = `${projectId}/${employeeId}.${ext}`;
  const buffer = Buffer.from(await blob.arrayBuffer());
  const contentType =
    ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  const { error: upError } = await admin.storage.from(BUCKET).upload(finalPath, buffer, {
    contentType,
    upsert: true,
    cacheControl: '3600',
  });

  if (upError) return null;

  await admin.storage.from(BUCKET).remove([photoPath]);

  const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(finalPath);
  await admin.from('employees').update({ photo_url: urlData.publicUrl }).eq('id', employeeId);

  return urlData.publicUrl;
}
