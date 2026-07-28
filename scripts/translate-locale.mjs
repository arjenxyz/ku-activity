#!/usr/bin/env node
/**
 * Translate json/{locale}/src string values EN → target locale via Google Translate.
 * Usage: node scripts/translate-locale.mjs <locale>
 * Example: node scripts/translate-locale.mjs de
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const EN_DIR = path.join(ROOT, 'json', 'en', 'src');
const CONCURRENCY = 2;

const PLACEHOLDER_RE = /\{[a-zA-Z0-9_]+\}/g;

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

function walkJsonFiles(dir, base = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkJsonFiles(full, rel));
    else if (entry.name.endsWith('.json')) files.push(rel.replace(/\\/g, '/'));
  }
  return files.sort();
}

function collectStrings(value, set) {
  if (typeof value === 'string') {
    if (value.trim()) set.add(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, set);
    return;
  }
  if (value && typeof value === 'object') {
    for (const v of Object.values(value)) collectStrings(v, set);
  }
}

function mapStrings(value, dict) {
  if (typeof value === 'string') return dict[value] ?? value;
  if (Array.isArray(value)) return value.map((item) => mapStrings(item, dict));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = mapStrings(v, dict);
    return out;
  }
  return value;
}

function protectPlaceholders(text) {
  const map = [];
  const protectedText = text.replace(PLACEHOLDER_RE, (m) => {
    const token = `⟦PH${map.length}⟧`;
    map.push(m);
    return token;
  });
  return { protectedText, map };
}

function restorePlaceholders(text, map) {
  let out = text;
  map.forEach((ph, i) => {
    out = out.replaceAll(`⟦PH${i}⟧`, ph);
    out = out.replaceAll(`[PH${i}]`, ph);
  });
  return out;
}

async function translateOne(text, targetLocale, attempt = 1) {
  const tl = GOOGLE_TL[targetLocale] ?? targetLocale;
  const { protectedText, map } = protectPlaceholders(text);
  const url =
    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${encodeURIComponent(tl)}&dt=t&q=` +
    encodeURIComponent(protectedText);
  try {
    const res = await fetch(url);
    if (res.status === 429) throw Object.assign(new Error('HTTP 429'), { retryable: true });
    if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { retryable: res.status >= 500 });
    const data = await res.json();
    const translated = (data[0] || []).map((part) => part[0]).join('');
    return restorePlaceholders(translated, map);
  } catch (err) {
    const retryable = err.retryable !== false;
    if (!retryable || attempt >= 8) {
      console.warn(`FAIL: ${text.slice(0, 80)} (${err.message})`);
      return null;
    }
    const wait = err.message.includes('429') ? 2000 * attempt : 400 * attempt;
    await sleep(wait);
    return translateOne(text, targetLocale, attempt + 1);
  }
}

async function mapPool(items, concurrency, worker) {
  const results = new Array(items.length);
  let idx = 0;
  async function run() {
    while (idx < items.length) {
      const i = idx++;
      results[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => run()));
  return results;
}

function needsTranslation(s, enStrings) {
  if (!s.trim()) return false;
  if (/^[A-Z0-9_./:-]+$/.test(s) && s.length < 40) return false;
  if (!/[A-Za-zÀ-ÿ]/.test(s)) return false;
  return enStrings.has(s);
}

async function main() {
  const targetLocale = process.argv[2];
  if (!targetLocale || !GOOGLE_TL[targetLocale]) {
    console.error('Usage: node scripts/translate-locale.mjs <locale>');
    console.error('Locales:', Object.keys(GOOGLE_TL).join(', '));
    process.exit(1);
  }

  const LOCALE_DIR = path.join(ROOT, 'json', targetLocale, 'src');
  const CACHE_FILE = path.join(ROOT, 'scripts', `_translate-cache-${targetLocale}.json`);

  if (!fs.existsSync(LOCALE_DIR)) {
    console.error(`Missing ${LOCALE_DIR} — run setup-locale-trees.mjs first`);
    process.exit(1);
  }

  const enUnique = new Set();
  for (const rel of walkJsonFiles(EN_DIR)) {
    if (rel === 'lib/i18n/attendance-messages.json') continue;
    const data = JSON.parse(fs.readFileSync(path.join(EN_DIR, rel), 'utf8').replace(/^\uFEFF/, ''));
    collectStrings(data, enUnique);
  }

  const cache = fs.existsSync(CACHE_FILE)
    ? JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8').replace(/^\uFEFF/, ''))
    : {};
  for (const [k, v] of Object.entries(cache)) {
    if (k === v || v == null) delete cache[k];
  }

  const files = walkJsonFiles(LOCALE_DIR);
  const unique = new Set();
  const fileData = new Map();

  for (const rel of files) {
    const full = path.join(LOCALE_DIR, rel);
    const data = JSON.parse(fs.readFileSync(full, 'utf8').replace(/^\uFEFF/, ''));
    fileData.set(rel, data);
    if (rel === 'lib/i18n/attendance-messages.json') {
      collectStrings(data[targetLocale] || data.en || {}, unique);
      continue;
    }
    collectStrings(data, unique);
  }

  const toTranslate = [...unique].filter((s) => {
    if (cache[s] && cache[s] !== s) return false;
    return needsTranslation(s, enUnique);
  });

  console.log(`[${targetLocale}] Files: ${files.length}`);
  console.log(`[${targetLocale}] Unique strings: ${unique.size}`);
  console.log(`[${targetLocale}] Cached: ${Object.keys(cache).length}`);
  console.log(`[${targetLocale}] To translate: ${toTranslate.length}`);

  let done = 0;
  let failed = 0;
  await mapPool(toTranslate, CONCURRENCY, async (text) => {
    const translated = await translateOne(text, targetLocale);
    done++;
    if (translated && translated !== text) cache[text] = translated;
    else if (translated === null) failed++;
    if (done % 50 === 0 || done === toTranslate.length) {
      fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
      console.log(`[${targetLocale}] progress ${done}/${toTranslate.length} (failed ${failed})`);
    }
    await sleep(150);
    return translated;
  });

  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));

  let written = 0;
  for (const [rel, data] of fileData) {
    const full = path.join(LOCALE_DIR, rel);
    let next;
    if (rel === 'lib/i18n/attendance-messages.json') {
      next = { ...data, [targetLocale]: mapStrings(data[targetLocale] || data.en || {}, cache) };
    } else {
      next = mapStrings(data, cache);
    }
    fs.writeFileSync(full, JSON.stringify(next, null, 2) + '\n', 'utf8');
    written++;
  }

  console.log(`[${targetLocale}] Wrote ${written} files. Failed: ${failed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
