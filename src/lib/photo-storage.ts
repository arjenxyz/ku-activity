import { createAdminClient } from '@/utils/supabase/admin';

/** Onaylı personel fotoğrafları — private */
export const EMPLOYEE_PHOTOS_BUCKET = 'employee-photos';

/** Başvuru ve OTP taslak selfie — private */
export const REGISTRATION_PHOTOS_BUCKET = 'registration-photos';

/** Tarayıcıda gösterim için imzalı URL süresi (saniye) */
export const SIGNED_PHOTO_TTL_SECONDS = 3600;

const LEGACY_EMPLOYEE_PREFIX = '/employee-photos/';
const LEGACY_REGISTRATION_PREFIX = '/registration-photos/';

export function employeePhotoObjectPath(projectId: string, employeeId: string, ext: string) {
  return `${projectId}/${employeeId}.${ext}`;
}

export function registrationPhotoObjectPath(requestId: string, ext = 'jpg') {
  return `registrations/${requestId}.${ext}`;
}

export function otpDraftPhotoObjectPath(challengeId: string, ext = 'jpg') {
  return `registrations/otp-drafts/${challengeId}.${ext}`;
}

/** DB'deki path veya eski public URL'den storage object path çıkarır */
export function resolveEmployeePhotoPath(
  photoPath: string | null | undefined,
  legacyPhotoUrl?: string | null
): string | null {
  const ref = photoPath?.trim() || legacyPhotoUrl?.trim() || null;
  if (!ref) return null;
  if (ref.startsWith('http')) {
    const idx = ref.indexOf(LEGACY_EMPLOYEE_PREFIX);
    if (idx >= 0) {
      return ref.slice(idx + LEGACY_EMPLOYEE_PREFIX.length).split('?')[0] || null;
    }
    return null;
  }
  if (ref.startsWith('registrations/') || ref.startsWith('otp-drafts/')) return null;
  return ref;
}

export function resolveRegistrationPhotoPath(photoPath: string | null | undefined): string | null {
  const ref = photoPath?.trim() || null;
  if (!ref) return null;
  if (ref.startsWith('http')) {
    const regIdx = ref.indexOf(LEGACY_REGISTRATION_PREFIX);
    if (regIdx >= 0) {
      return ref.slice(regIdx + LEGACY_REGISTRATION_PREFIX.length).split('?')[0] || null;
    }
    const empIdx = ref.indexOf(LEGACY_EMPLOYEE_PREFIX);
    if (empIdx >= 0) {
      const tail = ref.slice(empIdx + LEGACY_EMPLOYEE_PREFIX.length).split('?')[0];
      if (tail?.startsWith('registrations/') || tail?.startsWith('otp-drafts/')) return tail;
    }
    return null;
  }
  return ref;
}

async function createSignedUrl(bucket: string, path: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(bucket)
    .createSignedUrl(path, SIGNED_PHOTO_TTL_SECONDS);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export async function signedEmployeePhotoUrl(
  photoPath: string | null | undefined,
  legacyPhotoUrl?: string | null
): Promise<string | null> {
  const path = resolveEmployeePhotoPath(photoPath, legacyPhotoUrl);
  if (!path) return null;
  return createSignedUrl(EMPLOYEE_PHOTOS_BUCKET, path);
}

export async function signedRegistrationPhotoUrl(
  photoPath: string | null | undefined
): Promise<string | null> {
  const path = resolveRegistrationPhotoPath(photoPath);
  if (!path) return null;

  const signed = await createSignedUrl(REGISTRATION_PHOTOS_BUCKET, path);
  if (signed) return signed;

  // Eski kayıtlar employee-photos bucket'ında kalmış olabilir
  return createSignedUrl(EMPLOYEE_PHOTOS_BUCKET, path);
}

export async function downloadEmployeePhotoBytes(
  photoPath: string | null | undefined,
  legacyPhotoUrl?: string | null
): Promise<Uint8Array | null> {
  const path = resolveEmployeePhotoPath(photoPath, legacyPhotoUrl);
  if (!path) return null;

  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(EMPLOYEE_PHOTOS_BUCKET).download(path);
  if (error || !data) return null;
  return new Uint8Array(await data.arrayBuffer());
}

export async function downloadRegistrationPhotoBytes(
  photoPath: string | null | undefined
): Promise<Uint8Array | null> {
  const path = resolveRegistrationPhotoPath(photoPath);
  if (!path) return null;

  const admin = createAdminClient();
  const primary = await admin.storage.from(REGISTRATION_PHOTOS_BUCKET).download(path);
  let data = primary.data;
  if (primary.error || !data) {
    const legacy = await admin.storage.from(EMPLOYEE_PHOTOS_BUCKET).download(path);
    data = legacy.data;
    if (legacy.error || !data) return null;
  }
  return new Uint8Array(await data.arrayBuffer());
}

type WithPhotoFields = {
  photo_path?: string | null;
  photo_url?: string | null;
};

export async function withSignedEmployeePhoto<T extends WithPhotoFields>(
  row: T
): Promise<T & { photo_url: string | null }> {
  const signed = await signedEmployeePhotoUrl(row.photo_path, row.photo_url);
  return { ...row, photo_url: signed };
}

export async function withSignedEmployeePhotos<T extends WithPhotoFields>(
  rows: T[]
): Promise<Array<T & { photo_url: string | null }>> {
  return Promise.all(rows.map((row) => withSignedEmployeePhoto(row)));
}
