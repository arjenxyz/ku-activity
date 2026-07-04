#!/usr/bin/env node

/**
 * Bubblewrap çıktı klasöründen sürüm bilgisini okuyup APK'yı otomatik yükler.
 *
 *   node scripts/upload-apk-from-twa.mjs --app personnel
 *   node scripts/upload-apk-from-twa.mjs --app admin --dir twa-build/admin
 *
 * Ortam: APP_URL / NEXT_PUBLIC_APP_URL, APK_UPLOAD_SECRET
 * Opsiyonel: RELEASE_NOTES veya --notes
 */

import { readFileSync, existsSync } from 'fs';
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

const args = parseArgs(process.argv);
const appType = String(args.app ?? args.appType ?? '').trim();

if (appType !== 'personnel' && appType !== 'admin') {
  console.error('Kullanım: node scripts/upload-apk-from-twa.mjs --app personnel|admin [--dir twa-build/...] [--notes "..."]');
  process.exit(1);
}

const buildDir = resolve(ROOT, args.dir || DEFAULT_DIRS[appType]);
const manifestPath = join(buildDir, 'twa-manifest.json');
const apkPath = join(buildDir, 'app-release-signed.apk');

if (!existsSync(manifestPath)) {
  console.error(`twa-manifest.json bulunamadı: ${manifestPath}`);
  console.error('Önce bubblewrap init/build çalıştırın (twa/README.md).');
  process.exit(1);
}

if (!existsSync(apkPath)) {
  console.error(`APK bulunamadı: ${apkPath}`);
  console.error('Önce bubblewrap build çalıştırın.');
  process.exit(1);
}

let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
} catch {
  console.error('twa-manifest.json okunamadı');
  process.exit(1);
}

const versionName = String(manifest.appVersionName ?? manifest.versionName ?? '').trim();
const versionCode = String(manifest.appVersionCode ?? manifest.versionCode ?? '').trim();
const releaseNotes =
  String(args.notes ?? process.env.RELEASE_NOTES ?? '').trim() ||
  `Otomatik yükleme — ${appType} v${versionName} (${versionCode})`;

if (!versionName || !versionCode) {
  console.error('twa-manifest.json içinde appVersionName / appVersionCode gerekli');
  process.exit(1);
}

console.log(`Yükleniyor: ${appType} v${versionName} (${versionCode})`);
console.log(`APK: ${apkPath}`);

const result = spawnSync(
  process.execPath,
  [
    join(ROOT, 'scripts/upload-apk.mjs'),
    '--app',
    appType,
    '--file',
    apkPath,
    '--version',
    versionName,
    '--code',
    versionCode,
    '--notes',
    releaseNotes,
  ],
  {
    stdio: 'inherit',
    env: process.env,
    cwd: ROOT,
  }
);

process.exit(result.status ?? 1);
