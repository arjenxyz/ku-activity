import { createHash } from 'crypto';
import { PutObjectCommand, S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getGoogleDriveToken } from '@/lib/google-service-account';

export type StorageBackend = 'google_drive' | 'r2';

const MAX_DEKONT_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

export function getStorageBackend(): StorageBackend {
  const v = process.env.STORAGE_BACKEND?.trim().toLowerCase();
  if (v === 'r2') return 'r2';
  return 'google_drive';
}

async function uploadToGoogleDrive(params: {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
}) {
  const folderId = process.env.GOOGLE_DRIVE_DEKONT_FOLDER_ID?.trim();
  if (!folderId) {
    throw new Error('GOOGLE_DRIVE_DEKONT_FOLDER_ID tanımlı değil');
  }

  const accessToken = await getGoogleDriveToken();
  const boundary = `crewledger_${Date.now()}`;
  const metadata = JSON.stringify({
    name: params.fileName,
    parents: [folderId],
  });

  const body = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`
    ),
    Buffer.from(`--${boundary}\r\nContent-Type: ${params.mimeType}\r\n\r\n`),
    params.buffer,
    Buffer.from(`\r\n--${boundary}--`),
  ]);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  const data = (await res.json()) as { id?: string; error?: { message?: string } };
  if (!res.ok || !data.id) {
    throw new Error(data.error?.message || 'Dekont Google Drive\'a yüklenemedi');
  }
  return data.id;
}

async function signedGoogleDriveUrl(fileId: string) {
  const accessToken = await getGoogleDriveToken();
  return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&access_token=${accessToken}`;
}

function r2Client() {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 kimlik bilgileri eksik (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)');
  }
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function dekontObjectKey(projectId: string, requestId: string, fileName: string) {
  const safe = fileName.replace(/[^\w.\-()+]/g, '_').slice(0, 120);
  const hash = createHash('sha256').update(`${requestId}:${safe}:${Date.now()}`).digest('hex').slice(0, 12);
  return `dekontlar/${projectId}/${requestId}/${hash}-${safe}`;
}

export function assertDekontFile(mimeType: string, size: number) {
  if (size <= 0) throw new Error('Dosya boş');
  if (size > MAX_DEKONT_BYTES) throw new Error('Dekont en fazla 10 MB olabilir');
  if (!ALLOWED_MIME.has(mimeType)) {
    throw new Error('Yalnızca PDF veya görsel (JPG, PNG, WEBP) yüklenebilir');
  }
}

export async function uploadAdvanceDekont(params: {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  projectId: string;
  requestId: string;
  backend?: StorageBackend;
}) {
  assertDekontFile(params.mimeType, params.buffer.length);
  const backend = params.backend ?? getStorageBackend();

  if (backend === 'r2') {
    const bucket = process.env.R2_BUCKET_NAME?.trim();
    if (!bucket) throw new Error('R2_BUCKET_NAME tanımlı değil');
    const key = dekontObjectKey(params.projectId, params.requestId, params.fileName);
    const client = r2Client();
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: params.buffer,
        ContentType: params.mimeType,
      })
    );
    return { backend, externalId: key };
  }

  const externalId = await uploadToGoogleDrive({
    buffer: params.buffer,
    fileName: `${params.projectId.slice(0, 8)}-${params.requestId.slice(0, 8)}-${params.fileName}`,
    mimeType: params.mimeType,
  });
  return { backend: 'google_drive' as const, externalId };
}

export async function getAdvanceDekontUrl(params: {
  backend: StorageBackend;
  externalId: string;
  expiresInSeconds?: number;
}) {
  if (params.backend === 'google_drive') {
    return signedGoogleDriveUrl(params.externalId);
  }

  const bucket = process.env.R2_BUCKET_NAME?.trim();
  if (!bucket) throw new Error('R2_BUCKET_NAME tanımlı değil');
  const client = r2Client();
  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: bucket, Key: params.externalId }),
    { expiresIn: params.expiresInSeconds ?? 3600 }
  );
}
