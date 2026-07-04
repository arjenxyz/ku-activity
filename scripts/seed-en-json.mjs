#!/usr/bin/env node
/**
 * Copies json/src JSON files to json/en/src when EN file is missing.
 * Preserves manually translated EN files.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'json', 'src');
const EN_DIR = path.join(ROOT, 'json', 'en', 'src');

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

function main() {
  const files = walkJsonFiles(SRC_DIR);
  let copied = 0;
  let skipped = 0;

  for (const file of files) {
    const enPath = path.join(EN_DIR, file.relative);
    if (fs.existsSync(enPath)) {
      skipped += 1;
      continue;
    }
    fs.mkdirSync(path.dirname(enPath), { recursive: true });
    fs.copyFileSync(file.full, enPath);
    copied += 1;
  }

  console.log(`Seed EN JSON: copied=${copied}, skipped=${skipped}`);
}

main();
