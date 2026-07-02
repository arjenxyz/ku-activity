import { readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { CREWLEDGER_APP_ICON } from '@/lib/brand';

const ICON_FILE = path.join(process.cwd(), 'public', CREWLEDGER_APP_ICON.replace(/^\//, ''));

/** Orijinal PNG — şeffaflık korunur, arka plan rengi eklenmez */
export async function serveCrewledgerAppIcon(size = 512) {
  const source = await readFile(ICON_FILE);
  const buffer = await sharp(source)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400, immutable',
    },
  });
}
