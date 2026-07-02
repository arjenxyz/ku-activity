import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  CREWLEDGER_PWA_ICON_192,
  CREWLEDGER_PWA_ICON_512,
} from '@/lib/brand';

const PUBLIC_DIR = path.join(process.cwd(), 'public');

const ICON_BY_SIZE: Record<number, string> = {
  192: CREWLEDGER_PWA_ICON_192.replace(/^\//, ''),
  512: CREWLEDGER_PWA_ICON_512.replace(/^\//, ''),
};

export type AppIconVariant = 'any' | 'maskable';

/** Önceden üretilmiş tam dolgu PNG — maskable/any aynı (kenarlar #001840) */
export async function serveCrewledgerAppIcon(size = 512) {
  const file = ICON_BY_SIZE[size];
  if (!file) {
    return new Response('Invalid size', { status: 400 });
  }

  const buffer = await readFile(path.join(PUBLIC_DIR, file));
  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400, immutable',
    },
  });
}
