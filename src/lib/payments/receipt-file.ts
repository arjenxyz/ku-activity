const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
]);

const ALLOWED_EXT = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif']);

export const RECEIPT_FILE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,application/pdf,.pdf,.jpg,.jpeg,.png,.webp,.gif';

export function isAllowedReceiptFile(file: { name?: string; type?: string }) {
  const mime = (file.type || '').toLowerCase().trim();
  if (mime && ALLOWED_MIME.has(mime)) return true;
  if (mime.startsWith('image/') && mime !== 'image/svg+xml') return true;

  const name = (file.name || '').toLowerCase();
  const dot = name.lastIndexOf('.');
  if (dot >= 0 && ALLOWED_EXT.has(name.slice(dot))) return true;
  return false;
}

export const RECEIPT_FILE_TYPE_ERROR = 'Sadece PDF veya görsel (JPG, PNG, WEBP) kabul edilir';
