import { readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { appIconFileName, type AppIconVariant } from '@/lib/brand';

export type AppIconPurpose = 'any' | 'maskable';

const MASKABLE_BG: Record<AppIconVariant, { r: number; g: number; b: number }> = {
  personnel: { r: 234, g: 232, b: 245 },
  admin: { r: 232, g: 236, b: 240 },
};

function iconResponse(buffer: Buffer) {
  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400, immutable',
    },
  });
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

/** Android bildirim küçük ikonu — beyaz silüet, şeffaf arka plan (TWA monochromeIconUrl) */
export async function serveNotificationMonochromeIcon(variant: AppIconVariant, size: number) {
  const iconFile = path.join(process.cwd(), 'public', appIconFileName(variant));
  const source = await readFile(iconFile);
  const { data, info } = await sharp(source)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const out = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    out[i] = 255;
    out[i + 1] = 255;
    out[i + 2] = 255;
    out[i + 3] = alpha > 24 ? alpha : 0;
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
