#!/usr/bin/env node
/**
 * Resume / complete locale translations and attendance blocks.
 * Usage: node scripts/translate-all-locales.mjs [locale ...]
 */
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const DEFAULT_LOCALES = [
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

function run(cmd) {
  console.log(`\n> ${cmd}\n`);
  execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
}

const locales = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_LOCALES;

run('node scripts/setup-locale-trees.mjs');

for (const locale of locales) {
  run(`node scripts/translate-locale.mjs ${locale}`);
}

run('node scripts/expand-attendance-messages.mjs');
run('node scripts/generate-strings-registry.mjs');

console.log('\nAll locale translations completed.');
