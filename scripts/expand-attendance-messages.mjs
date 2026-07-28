#!/usr/bin/env node
/**
 * Expand json/src/lib/i18n/attendance-messages.json with all locale blocks,
 * translating from the EN block.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ATTENDANCE_FILE = path.join(ROOT, 'json', 'src', 'lib', 'i18n', 'attendance-messages.json');

const LOCALES = [
  'tr',
  'en',
  'zh',
  'hi',
  'es',
  'fr',
  'ar',
  'bn',
  'pt',
  'ru',
  'ur',
  'id',
  'de',
  'ja',
  'hu',
];

const GOOGLE_TL = {
  tr: 'tr',
  en: 'en',
  zh: 'zh-CN',
  hi: 'hi',
  es: 'es',
  fr: 'fr',
  ar: 'ar',
  bn: 'bn',
  pt: 'pt',
  ru: 'ru',
  ur: 'ur',
  id: 'id',
  de: 'de',
  ja: 'ja',
  hu: 'hu',
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function translateOne(text, locale, attempt = 1) {
  const tl = GOOGLE_TL[locale];
  const url =
    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${encodeURIComponent(tl)}&dt=t&q=` +
    encodeURIComponent(text);
  try {
    const res = await fetch(url);
    if (res.status === 429) throw new Error('HTTP 429');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return (data[0] || []).map((part) => part[0]).join('');
  } catch (err) {
    if (attempt >= 6) throw err;
    await sleep(err.message.includes('429') ? 2000 * attempt : 500 * attempt);
    return translateOne(text, locale, attempt + 1);
  }
}

async function main() {
  const data = JSON.parse(fs.readFileSync(ATTENDANCE_FILE, 'utf8').replace(/^\uFEFF/, ''));
  const enBlock = data.en;
  if (!enBlock) throw new Error('Missing en block in attendance-messages.json');

  for (const locale of LOCALES) {
    if (locale === 'tr' || locale === 'en') continue;
    if (data[locale] && Object.keys(data[locale]).length === Object.keys(enBlock).length) {
      console.log(`skip ${locale}: already present`);
      continue;
    }
    console.log(`translating attendance block → ${locale}`);
    const block = {};
    const keys = Object.keys(enBlock);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      block[key] = await translateOne(enBlock[key], locale);
      await sleep(120);
      if ((i + 1) % 5 === 0) console.log(`  ${locale}: ${i + 1}/${keys.length}`);
    }
    data[locale] = block;
    fs.writeFileSync(ATTENDANCE_FILE, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log(`saved ${locale} block`);
  }

  // Sync to all locale trees
  for (const locale of LOCALES) {
    if (locale === 'tr') continue;
    const target = path.join(ROOT, 'json', locale, 'src', 'lib', 'i18n', 'attendance-messages.json');
    if (fs.existsSync(path.dirname(target))) {
      fs.writeFileSync(target, JSON.stringify(data, null, 2) + '\n', 'utf8');
    }
  }
  console.log('Synced attendance-messages to all locale trees.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
