#!/usr/bin/env node
/**
 * Copy json/en/src → json/{locale}/src for all locales that lack a tree.
 * Usage: node scripts/setup-locale-trees.mjs [locale ...]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const EN_DIR = path.join(ROOT, 'json', 'en', 'src');

const ALL_LOCALES = [
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
];

function copyTree(locale) {
  const target = path.join(ROOT, 'json', locale, 'src');
  if (fs.existsSync(target)) {
    const count = walkJsonFiles(target).length;
    console.log(`skip ${locale}: already has ${count} files`);
    return;
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (process.platform === 'win32') {
    try {
      execSync(`robocopy "${EN_DIR}" "${target}" /E /NFL /NDL /NJH /NJS /nc /ns /np`, {
        stdio: 'inherit',
      });
    } catch (err) {
      // robocopy: 0–7 = success
      if (!err.status || err.status > 7) throw err;
    }
  } else {
    execSync(`cp -R "${EN_DIR}" "${target}"`, { stdio: 'inherit' });
  }
  console.log(`copied en → ${locale} (${walkJsonFiles(target).length} files)`);
}

function walkJsonFiles(dir, base = '') {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkJsonFiles(full, rel));
    else if (entry.name.endsWith('.json')) files.push(rel.replace(/\\/g, '/'));
  }
  return files;
}

const locales = process.argv.slice(2).length ? process.argv.slice(2) : ALL_LOCALES;
for (const locale of locales) copyTree(locale);
console.log('Done.');
