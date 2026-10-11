/**
 * Downloads Turkish + English Tesseract traineddata (gzip) into
 * src/lib/payments/tessdata for offline/serverless OCR.
 */
import { createWriteStream, existsSync, mkdirSync, statSync } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'src', 'lib', 'payments', 'tessdata');
const BASE = 'https://tessdata.projectnaptha.com/4.0.0';
const LANGS = ['eng', 'tur'];
const MIN_BYTES = 100_000;

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok || !res.body) {
    throw new Error(`Failed to download ${url}: ${res.status}`);
  }
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
}

async function ensureLang(lang) {
  const dest = path.join(OUT_DIR, `${lang}.traineddata.gz`);
  if (existsSync(dest) && statSync(dest).size >= MIN_BYTES) {
    console.log(`[tessdata] ok ${lang} (${statSync(dest).size} bytes)`);
    return;
  }
  const url = `${BASE}/${lang}.traineddata.gz`;
  console.log(`[tessdata] downloading ${url}`);
  await download(url, dest);
  const size = statSync(dest).size;
  if (size < MIN_BYTES) {
    throw new Error(`[tessdata] ${lang} download too small (${size} bytes)`);
  }
  console.log(`[tessdata] wrote ${lang} (${size} bytes)`);
}

mkdirSync(OUT_DIR, { recursive: true });
for (const lang of LANGS) {
  await ensureLang(lang);
}
