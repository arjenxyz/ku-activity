#!/usr/bin/env node
/**
 * Fast EN/TR → HU translation for json/hu/src.
 * Collects unique strings, translates with concurrency + 429 backoff, applies back.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const HU_DIR = path.join(ROOT, 'json', 'hu', 'src');
const CACHE_FILE = path.join(ROOT, 'scripts', '_hu-translate-cache.json');
const CONCURRENCY = 2;

const PLACEHOLDER_RE = /\{[a-zA-Z0-9_]+\}/g;

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

function looksHungarian(s) {
  const huMarks = (s.match(/[áéíóöőúüűÁÉÍÓÖŐÚÜŰ]/g) || []).length;
  const letters = (s.match(/[A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüű]/g) || []).length || 1;
  if (huMarks / letters > 0.06) return true;
  const lower = ` ${s.toLowerCase()} `;
  const huHints = [
    ' a ', ' az ', ' és ', ' nem ', ' vagy ', ' hogy ', ' van ', ' kell ',
    ' sikeres', ' hiba', ' mentés', ' törlés', ' kiválaszt', ' betölt',
    ' projekt', ' személyzet', ' jelenlét', ' jelszó', ' beállít',
  ];
  return huHints.some((h) => lower.includes(h));
}

function needsTranslation(s) {
  if (!s.trim()) return false;
  if (looksHungarian(s)) return false;
  if (!/[A-Za-zÀ-ÿÇĞİÖŞÜçğıöşü]/.test(s)) return false;
  if (/^[A-Z0-9_./:-]+$/.test(s) && s.length < 40) return false;
  return true;
}

async function translateOne(text, attempt = 1) {
  const { protectedText, map } = protectPlaceholders(text);
  const url =
    'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=hu&dt=t&q=' +
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
    const wait = err.message.includes('429') ? 1500 * attempt : 400 * attempt;
    await sleep(wait);
    return translateOne(text, attempt + 1);
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

async function main() {
  const files = walkJsonFiles(HU_DIR);
  const cache = fs.existsSync(CACHE_FILE)
    ? JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8').replace(/^\uFEFF/, ''))
    : {};

  // Drop identity / failed entries
  for (const [k, v] of Object.entries(cache)) {
    if (k === v || v == null) delete cache[k];
  }

  const unique = new Set();
  const fileData = new Map();

  for (const rel of files) {
    const full = path.join(HU_DIR, rel);
    const raw = fs.readFileSync(full, 'utf8').replace(/^\uFEFF/, '');
    const data = JSON.parse(raw);
    fileData.set(rel, data);

    if (rel === 'lib/i18n/attendance-messages.json') {
      collectStrings(data.hu || {}, unique);
      continue;
    }
    collectStrings(data, unique);
  }

  const toTranslate = [...unique].filter((s) => {
    if (cache[s] && cache[s] !== s) return false;
    return needsTranslation(s);
  });

  console.log(`Files: ${files.length}`);
  console.log(`Unique strings: ${unique.size}`);
  console.log(`Cached good: ${Object.keys(cache).length}`);
  console.log(`To translate: ${toTranslate.length}`);

  let done = 0;
  let failed = 0;
  await mapPool(toTranslate, CONCURRENCY, async (text) => {
    const translated = await translateOne(text);
    done++;
    if (translated && translated !== text) {
      cache[text] = translated;
    } else if (translated === null) {
      failed++;
    } else if (translated === text) {
      // auto detected already target? keep as-is without caching identity forever
      cache[text] = translated;
    }
    if (done % 50 === 0 || done === toTranslate.length) {
      fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
      console.log(`  progress ${done}/${toTranslate.length} (failed ${failed}, cached ${Object.keys(cache).length})`);
    }
    await sleep(120);
    return translated;
  });

  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));

  let written = 0;
  for (const [rel, data] of fileData) {
    const full = path.join(HU_DIR, rel);
    let next;
    if (rel === 'lib/i18n/attendance-messages.json') {
      next = { ...data, hu: mapStrings(data.hu || {}, cache) };
    } else {
      next = mapStrings(data, cache);
    }
    fs.writeFileSync(full, JSON.stringify(next, null, 2) + '\n', 'utf8');
    written++;
  }

  console.log(`Wrote ${written} files. Failed strings: ${failed}`);
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
