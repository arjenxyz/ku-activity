#!/usr/bin/env node
/**
 * Setup locale trees and translate all missing locales sequentially.
 */
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const LOCALES = ['zh', 'hi', 'es', 'fr', 'ar', 'bn', 'pt', 'ru', 'ur', 'id', 'de', 'ja'];

function run(cmd) {
  console.log(`\n> ${cmd}\n`);
  execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
}

run('node scripts/setup-locale-trees.mjs');

for (const locale of LOCALES) {
  run(`node scripts/translate-locale.mjs ${locale}`);
}

run('node scripts/expand-attendance-messages.mjs');
run('node scripts/generate-strings-registry.mjs');

console.log('\nAll locales integrated.');
