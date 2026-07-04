#!/usr/bin/env node

/**
 * Bubblewrap build + otomatik APK yükleme (developer onayı bekler).
 *
 *   node scripts/bubblewrap-build-upload.mjs --app personnel
 *   node scripts/bubblewrap-build-upload.mjs --app admin --skip-build
 *
 * Ortam: APP_URL, APK_UPLOAD_SECRET
 */

import { existsSync } from 'fs';
import { join, resolve } from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));

const DEFAULT_DIRS = {
  personnel: 'twa-build/personel',
  admin: 'twa-build/admin',
};

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith('--')) continue;
    const name = key.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith('--')) {
      args[name] = true;
    } else {
      args[name] = value;
      i += 1;
    }
  }
  return args;
}

function run(cmd, args, cwd) {
  console.log(`\n> ${cmd} ${args.join(' ')}\n`);
  const result = spawnSync(cmd, args, { stdio: 'inherit', cwd, shell: process.platform === 'win32' });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const args = parseArgs(process.argv);
const appType = String(args.app ?? args.appType ?? '').trim();
const skipBuild = Boolean(args['skip-build']);

if (appType !== 'personnel' && appType !== 'admin') {
  console.error('Kullanım: node scripts/bubblewrap-build-upload.mjs --app personnel|admin [--skip-build] [--notes "..."]');
  process.exit(1);
}

const buildDir = resolve(ROOT, args.dir || DEFAULT_DIRS[appType]);

if (!existsSync(join(buildDir, 'twa-manifest.json'))) {
  console.error(`Bubblewrap projesi yok: ${buildDir}`);
  console.error('twa/README.md — bubblewrap init adımlarını uygulayın.');
  process.exit(1);
}

if (!skipBuild) {
  run('bubblewrap', ['build'], buildDir);
}

const uploadArgs = [
  join(ROOT, 'scripts/upload-apk-from-twa.mjs'),
  '--app',
  appType,
  '--dir',
  buildDir,
];

if (args.notes) {
  uploadArgs.push('--notes', String(args.notes));
}

run(process.execPath, uploadArgs, ROOT);

console.log('\nTamam. Developer panelden Yayınla: /developer-panel/releases');
