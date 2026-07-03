/** Ekran raporu — paylaşılan tipler */

export type ScreenReportInput = {
  screenshotBase64: string;
  pageUrl: string;
  userAgent: string;
  capturedAt: string;
  formError?: string;
  diagnostics?: string[];
  note?: string;
  screenLabel?: string;
};

export function stripScreenshotDataUrl(dataUrl: string): string {
  const idx = dataUrl.indexOf(',');
  return idx >= 0 ? dataUrl.slice(idx + 1) : dataUrl;
}
