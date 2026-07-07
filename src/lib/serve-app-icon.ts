import { readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { appIconFileName, type AppIconVariant } from '@/lib/brand';

export type AppIconPurpose = 'any' | 'maskable';

const MASKABLE_BG: Record<AppIconVariant, { r: number; g: number; b: number }> = {
  personnel: { r: 234, g: 232, b: 245 },
  admin: { r: 232, g: 236, b: 240 },
};

const ICON_HEADERS = {
  'Content-Type': 'image/png',
  'Cache-Control': 'public, max-age=86400, immutable',
} as const;

function iconResponse(buffer: Buffer) {
  return new Response(new Uint8Array(buffer), {
    headers: ICON_HEADERS,
  });
}

/** HEAD — sharp çalıştırmadan izleme / health check */
export function iconHeadResponse() {
  return new Response(null, { status: 200, headers: ICON_HEADERS });
}

/** Personel / yönetici PNG — PWA, TWA, maskable */
export async function serveAppIcon(
  variant: AppIconVariant,
  size: number,
  purpose: AppIconPurpose = 'any'
) {
  const iconFile = path.join(process.cwd(), 'public', appIconFileName(variant));
  const source = await readFile(iconFile);

  if (purpose === 'any') {
    const buffer = await sharp(source).resize(size, size, { fit: 'cover' }).png().toBuffer();
    return iconResponse(buffer);
  }

  const bg = MASKABLE_BG[variant];
  const inner = Math.round(size * 0.8);
  const pad = Math.round((size - inner) / 2);
  const logo = await sharp(source).resize(inner, inner, { fit: 'contain', background: bg }).png().toBuffer();

  const buffer = await sharp({
    create: { width: size, height: size, channels: 3, background: bg },
  })
    .composite([{ input: logo, top: pad, left: pad }])
    .png()
    .toBuffer();

  return iconResponse(buffer);
}

function luminance(r: number, g: number, b: number) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * Soldaki küçük bildirim ikonu — crewledger markasından beyaz silüet (şeffaf arka plan).
 * Android/TWA renkli PNG'yi beyaz kareye çevirir; yalnızca silüet çalışır.
 */
export async function serveNotificationMonochromeIcon(_variant: AppIconVariant, size: number) {
  const iconFile = path.join(process.cwd(), 'public', 'crewledger.png');
  const source = await readFile(iconFile);
  const { data, info } = await sharp(source)
    .resize(size, size, { fit: 'cover' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixelCount = data.length / 4;
  let transparentPixels = 0;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 24) transparentPixels += 1;
  }

  const useAlphaMask = transparentPixels > pixelCount * 0.05;
  const logoLuminanceThreshold = 90;

  const out = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const isLogo = useAlphaMask
      ? data[i + 3] > 24
      : luminance(r, g, b) > logoLuminanceThreshold;

    if (isLogo) {
      out[i] = 255;
      out[i + 1] = 255;
      out[i + 2] = 255;
      out[i + 3] = useAlphaMask ? data[i + 3] : 255;
    }
  }

  const buffer = await sharp(out, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();

  return iconResponse(buffer);
}

/** @deprecated personel-icon.png kullanın */
export async function serveCrewledgerAppIcon(size = 512) {
  return serveAppIcon('personnel', size, 'any');
}
