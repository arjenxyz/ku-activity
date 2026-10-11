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

export const RECEIPT_FILE_TYPE_ERROR =
  'Bu format kabul edilmez. PDF, JPG, PNG veya WEBP yükleyin.';

export function isAllowedReceiptFile(file: { name?: string; type?: string }) {
  const mime = (file.type || '').toLowerCase().trim();
  const name = (file.name || '').toLowerCase();
  const dot = name.lastIndexOf('.');
  const ext = dot >= 0 ? name.slice(dot) : '';

  if (!ext || !ALLOWED_EXT.has(ext)) return false;

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

/** Detect real file type from magic bytes. */
export function sniffReceiptMime(buffer: Buffer): string | null {
  if (buffer.length >= 5 && buffer.subarray(0, 5).toString('ascii') === '%PDF-') {
    return 'application/pdf';
  }
  if (buffer.length >= 4 && buffer.subarray(0, 4).toString('ascii') === '%PDF') {
    return 'application/pdf';
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'image/png';
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

/**
 * Resolve MIME from content (magic bytes). Rejects spoofed extensions
 * when declared type family disagrees with sniffed content.
 */
export function resolveVerifiedReceiptMime(
  file: { name?: string; type?: string },
  buffer: Buffer
): string | null {
  if (!isAllowedReceiptFile(file)) return null;
  const sniffed = sniffReceiptMime(buffer);
  if (!sniffed || !ALLOWED_MIME.has(sniffed)) return null;

  const declared = resolveReceiptMime(file);
  const sniffedIsPdf = sniffed === 'application/pdf';
  const declaredIsPdf = declared === 'application/pdf';
  if (declared !== 'application/octet-stream' && sniffedIsPdf !== declaredIsPdf) {
    return null;
  }

  return sniffed === 'image/jpg' ? 'image/jpeg' : sniffed;
}
