import 'server-only';

const MAX_PDF_PAGES = 3;
const PDF_RENDER_SCALE = 2;

/** PDF.js tabanlı paketler Vercel'de DOMMatrix ister — yüklemeden önce polyfill. */
function ensurePdfPolyfills(): void {
  if (typeof globalThis.DOMMatrix !== 'undefined') return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const DOMMatrixPolyfill = require('dommatrix') as { default?: typeof DOMMatrix };
    globalThis.DOMMatrix =
      (DOMMatrixPolyfill.default ?? DOMMatrixPolyfill) as typeof DOMMatrix;
  } catch {
    globalThis.DOMMatrix = class DOMMatrix {
      constructor() {}
    } as unknown as typeof DOMMatrix;
  }
}

/** Taranmış PDF dekontları — ilk sayfaları PNG'ye çevirir (MuPDF, native canvas gerekmez). */
export async function rasterizePdfPages(
  pdfBuffer: Buffer,
  maxPages = MAX_PDF_PAGES
): Promise<Buffer[]> {
  ensurePdfPolyfills();
  const mupdf = (await import('mupdf')).default;
  const doc = mupdf.Document.openDocument(pdfBuffer, 'application/pdf');
  const pageCount = Math.min(doc.countPages(), maxPages);
  const images: Buffer[] = [];

  for (let i = 0; i < pageCount; i++) {
    const page = doc.loadPage(i);
    const pixmap = page.toPixmap(
      mupdf.Matrix.scale(PDF_RENDER_SCALE, PDF_RENDER_SCALE),
      mupdf.ColorSpace.DeviceRGB
    );
    images.push(Buffer.from(pixmap.asPNG()));
  }

  return images;
}

/** Görsel tamponları üzerinde ücretsiz Tesseract OCR (Türkçe + İngilizce). */
export async function ocrImagesWithTesseract(imageBuffers: Buffer[]): Promise<string> {
  if (imageBuffers.length === 0) return '';

  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('tur+eng', undefined, {
    logger: () => undefined,
  });

  try {
    const parts: string[] = [];
    for (const image of imageBuffers) {
      const { data } = await worker.recognize(image);
      const text = data.text?.trim();
      if (text) parts.push(text);
    }
    return parts.join('\n\n');
  } finally {
    await worker.terminate();
  }
}
