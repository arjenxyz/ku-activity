import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { CREWLEDGER_APP_ICON } from '@/lib/brand';

const ICON_FILE = path.join(process.cwd(), 'public', CREWLEDGER_APP_ICON.replace(/^\//, ''));

/** crewledger.png — PWA / manifest ikon endpoint'leri */
export async function serveCrewledgerAppIcon() {
  const buffer = await readFile(ICON_FILE);
  return new Response(buffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400, immutable',
    },
  });
}
