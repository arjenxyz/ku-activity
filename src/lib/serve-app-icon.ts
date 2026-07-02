import { readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { CREWLEDGER_ICON_BG } from '@/lib/brand';

const ICON_FILE = path.join(process.cwd(), 'public', 'crewledger.png');

function parseHex(hex: string) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
    alpha: 1,
  };
}

export type AppIconVariant = 'any' | 'maskable';

async function buildIconBuffer(size: number, variant: AppIconVariant) {
  const source = await readFile(ICON_FILE);
  const trimmed = await sharp(source).trim().toBuffer();
  const { width: tw = size, height: th = size } = await sharp(trimmed).metadata();

  const fillRatio = variant === 'maskable' ? 0.72 : 1;
  const target = Math.round(size * fillRatio);
  const scale = Math.min(target / tw, target / th);
  const resizedW = Math.max(1, Math.round(tw * scale));
  const resizedH = Math.max(1, Math.round(th * scale));

  const logo = await sharp(trimmed)
    .resize(resizedW, resizedH, { fit: 'fill' })
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: parseHex(CREWLEDGER_ICON_BG),
    },
  })
    .composite([{ input: logo, gravity: 'centre' }])
    .png()
    .toBuffer();
}

/** crewledger.png — PWA / manifest ikon endpoint'leri */
export async function serveCrewledgerAppIcon(size = 512, variant: AppIconVariant = 'any') {
  const buffer = await buildIconBuffer(size, variant);
  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400, immutable',
    },
  });
}
