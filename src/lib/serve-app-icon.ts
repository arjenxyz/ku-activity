import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { APP_ICON, appIconFileName, type AppIconVariant } from '@/lib/brand';

export type AppIconPurpose = 'any' | 'maskable';

const ICON_HEADERS = {
  'Content-Type': 'image/png',
  'Cache-Control': 'public, max-age=86400, immutable',
} as const;

function iconResponse(buffer: Buffer) {
  return new Response(new Uint8Array(buffer), {
    headers: ICON_HEADERS,
  });
}

export function iconHeadResponse() {
  return new Response(null, { status: 200, headers: ICON_HEADERS });
}

/** Serve existing Public PNG assets without CrewLedger domain logic. */
export async function serveAppIcon(
  variant: AppIconVariant,
  size: number,
  purpose: AppIconPurpose = 'any'
) {
  void size;
  void purpose;
  const fileName = appIconFileName(variant) || APP_ICON.replace(/^\//, '');
  const iconFile = path.join(process.cwd(), 'public', fileName);
  const source = await readFile(iconFile);
  return iconResponse(source);
}
