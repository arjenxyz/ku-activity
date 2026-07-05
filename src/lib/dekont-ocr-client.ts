'use client';

const MAX_PDF_PAGES = 2;
const PDF_RENDER_SCALE = 1.75;

function sniffDekontBlobKind(bytes: Uint8Array, mimeType: string): 'pdf' | 'image' | 'unknown' {
  if (bytes.length >= 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return 'pdf';
  }
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xd8) return 'image';
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return 'image';
  }
  const mime = mimeType.toLowerCase();
  if (mime === 'application/pdf') return 'pdf';
  if (mime.startsWith('image/')) return 'image';
  return 'unknown';
}

async function readHeader(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.slice(0, 8).arrayBuffer());
}

async function ocrImageBlob(blob: Blob): Promise<string> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('tur+eng', undefined, {
    logger: () => undefined,
  });
  try {
    const { data } = await worker.recognize(blob);
    return data.text?.trim() ?? '';
  } finally {
    await worker.terminate();
  }
}

async function ocrPdfBlob(blob: Blob): Promise<string> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;

  const data = await blob.arrayBuffer();
  const doc = await pdfjs.getDocument({ data }).promise;
  const pageCount = Math.min(doc.numPages, MAX_PDF_PAGES);
  const parts: string[] = [];

  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('tur+eng', undefined, {
    logger: () => undefined,
  });

  try {
    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await doc.getPage(pageNum);
      const viewport = page.getViewport({ scale: PDF_RENDER_SCALE });
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      await page.render({ canvasContext: ctx, viewport, canvas }).promise;
      const { data: ocrData } = await worker.recognize(canvas);
      const text = ocrData.text?.trim();
      if (text) parts.push(text);
    }
  } finally {
    await worker.terminate();
  }

  return parts.join('\n\n');
}

/** Tarayıcıda ücretsiz Tesseract OCR — Vercel sunucu zaman aşımı olmadan. */
export async function ocrDekontBlob(blob: Blob, mimeType: string): Promise<string> {
  const header = await readHeader(blob);
  const kind = sniffDekontBlobKind(header, mimeType || blob.type);

  let text = '';
  if (kind === 'image') {
    text = await ocrImageBlob(blob);
  } else if (kind === 'pdf') {
    text = await ocrPdfBlob(blob);
  } else {
    throw new Error('Dosya türü tanınamadı — PDF veya görsel (JPG/PNG) gönderin');
  }

  if (!text.trim()) {
    throw new Error('Dekonttan metin okunamadı — görüntü netliğini kontrol edin');
  }

  return text;
}
