#!/usr/bin/env node
/**
 * Generates json/en/src JSON files from json/src using MyMemory API.
 * Skips files that already exist in json/en unless --force is passed.
 * Caches translations in scripts/.translation-cache.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'json', 'src');
const EN_DIR = path.join(ROOT, 'json', 'en', 'src');
const CACHE_FILE = path.join(__dirname, '.translation-cache.json');
const force = process.argv.includes('--force');
const dryRun = process.argv.includes('--dry-run');

const SKIP_PATTERNS = [
  /^lib\/i18n\/attendance-messages\.json$/,
];

function loadCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function saveCache(cache) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

const cache = loadCache();
let apiCalls = 0;

function shouldSkip(relativePath) {
  return SKIP_PATTERNS.some((pattern) => pattern.test(relativePath.replace(/\\/g, '/')));
}

function isTranslatable(value) {
  if (typeof value !== 'string') return false;
  if (!value.trim()) return false;
  if (/^[\d\s+\-().,{}\[\]:;/@#%&*!?'"\\|]+$/.test(value)) return false;
  if (/^\{[a-zA-Z]+\}$/.test(value.trim())) return false;
  if (/^https?:\/\//.test(value)) return false;
  if (/^[A-Z0-9_]+$/.test(value) && value.length < 40) return false;
  return /[ğüşıöçĞÜŞİÖÇ]/.test(value) || /\b(ve|için|ile|bir|bu|veya|gibi|olarak|kaydet|giriş|çıkış|proje|personel|yönetici|yevmiye|avans|kesinti|bordro|onay|iptal|hata|başarı|yükleniyor)\b/i.test(value);
}

async function translateText(text) {
  if (cache[text]) return cache[text];
  if (!isTranslatable(text)) {
    cache[text] = text;
    return text;
  }

  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=tr|en`;
  apiCalls += 1;
  if (apiCalls % 10 === 0) {
    await new Promise((r) => setTimeout(r, 1200));
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Translation failed (${res.status}) for: ${text.slice(0, 80)}`);
  const data = await res.json();
  const translated = data?.responseData?.translatedText ?? text;
  cache[text] = translated;
  return translated;
}

async function translateValue(value) {
  if (typeof value === 'string') return translateText(value);
  if (Array.isArray(value)) {
    const out = [];
    for (const item of value) {
      out.push(await translateValue(item));
    }
    return out;
  }
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, nested] of Object.entries(value)) {
      out[key] = await translateValue(nested);
    }
    return out;
  }
  return value;
}

function walkJsonFiles(dir, base = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkJsonFiles(full, rel));
    } else if (entry.name.endsWith('.json')) {
      files.push({ relative: rel.replace(/\\/g, '/'), full });
    }
  }
  return files;
}

async function main() {
  const files = walkJsonFiles(SRC_DIR);
  let created = 0;
  let skipped = 0;

  for (const file of files) {
    const relativeJson = file.relative;
    if (shouldSkip(relativeJson)) {
      skipped += 1;
      continue;
    }

    const enPath = path.join(EN_DIR, relativeJson);
    if (!force && fs.existsSync(enPath)) {
      skipped += 1;
      continue;
    }

    const trContent = JSON.parse(fs.readFileSync(file.full, 'utf8'));
    console.log(`Translating ${relativeJson}...`);
    const enContent = dryRun ? trContent : await translateValue(trContent);

    if (!dryRun) {
      fs.mkdirSync(path.dirname(enPath), { recursive: true });
      fs.writeFileSync(enPath, `${JSON.stringify(enContent, null, 2)}\n`);
    }
    created += 1;
  }

  saveCache(cache);
  console.log(`Done. created=${created}, skipped=${skipped}, apiCalls=${apiCalls}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
