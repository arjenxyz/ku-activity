/** Görünür ekranın ekran görüntüsünü al (auth / hata raporu) */

import { maskSensitiveFieldsInClone } from '@/lib/sensitive-capture';
import strings from '@json/src/lib/capture-screen.json';

export async function captureElementScreenshot(
  element: HTMLElement,
  options?: { maxWidth?: number; quality?: number }
): Promise<string> {
  const { maxWidth = 1280, quality = 0.82 } = options ?? {};
  const { default: html2canvas } = await import('html2canvas');

  const canvas = await html2canvas(element, {
    useCORS: true,
    allowTaint: true,
    backgroundColor: null,
    scale: Math.min(window.devicePixelRatio || 1, 2),
    ignoreElements: (el) =>
      el.classList.contains('screen-report-modal-root') ||
      el.classList.contains('screen-report-ignore'),
    onclone: (clonedDoc) => {
      maskSensitiveFieldsInClone(clonedDoc);
    },
  });

  let out = canvas;
  if (canvas.width > maxWidth) {
    const ratio = maxWidth / canvas.width;
    const resized = document.createElement('canvas');
    resized.width = maxWidth;
    resized.height = Math.round(canvas.height * ratio);
    const ctx = resized.getContext('2d');
    if (!ctx) throw new Error(strings.canvasCreateFailed);
    ctx.drawImage(canvas, 0, 0, resized.width, resized.height);
    out = resized;
  }

  return out.toDataURL('image/jpeg', quality);
}
