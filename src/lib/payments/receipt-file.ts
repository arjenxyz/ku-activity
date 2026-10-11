const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

const ALLOWED_EXT = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.webp']);

export const RECEIPT_FILE_ACCEPT =
  'application/pdf,image/jpeg,image/png,image/webp,.pdf,.jpg,.jpeg,.png,.webp';

export function isAllowedReceiptFile(file: { name?: string; type?: string }) {
  const mime = (file.type || '').toLowerCase().trim();
  const name = (file.name || '').toLowerCase();
  const dot = name.lastIndexOf('.');
  const ext = dot >= 0 ? name.slice(dot) : '';

  // Extension is required and must be on the allowlist.
  if (!ext || !ALLOWED_EXT.has(ext)) return false;

  // If the browser reports a MIME type, it must also be allowlisted.
  if (mime && mime !== 'application/octet-stream' && !ALLOWED_MIME.has(mime)) {
    return false;
  }

  return true;
}

/** Prefer browser MIME; fall back to extension when empty/octet-stream. */
export function resolveReceiptMime(file: { name?: string; type?: string }): string {
  const mime = (file.type || '').toLowerCase().trim();
  if (mime && mime !== 'application/octet-stream' && ALLOWED_MIME.has(mime)) {
    return mime === 'image/jpg' ? 'image/jpeg' : mime;
  }
  const name = (file.name || '').toLowerCase();
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : '';
  switch (ext) {
    case '.pdf':
      return 'application/pdf';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    default:
      return mime || 'application/octet-stream';
  }
}

export const RECEIPT_FILE_TYPE_ERROR = 'Bu format kabul edilmez. PDF, JPG, PNG veya WEBP yükleyin.';
