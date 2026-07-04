#!/usr/bin/env node

/**
 * Bubblewrap build sonrası APK'yı sunucuya yükler (onay bekler).
 *
 * Kullanım:
 *   node scripts/upload-apk.mjs \
 *     --app personnel \
 *     --file ./app-release-signed.apk \
 *     --version 1.0.0 \
 *     --code 1 \
 *     --notes "İlk sürüm"
 *
 * Ortam değişkenleri:
 *   APP_URL veya NEXT_PUBLIC_APP_URL — hedef site (ör. https://crewledger.vercel.app)
 *   APK_UPLOAD_SECRET — Bearer token (Vercel env)
 */

import { readFileSync } from 'fs';
import { basename } from 'path';

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

function buildUploadAuthHeaders(rawSecret) {
  if (/[^\u0000-\u00ff]/.test(rawSecret)) {
    return {
      'X-Apk-Upload-Secret': Buffer.from(rawSecret, 'utf8').toString('base64'),
      'X-Apk-Upload-Secret-Encoding': 'base64',
    };
  }
  return { Authorization: `Bearer ${rawSecret}` };
}

const args = parseArgs(process.argv);
const appType = String(args.app ?? args.appType ?? '').trim();
const filePath = String(args.file ?? '').trim();
const versionName = String(args.version ?? args.versionName ?? '').trim();
const versionCode = String(args.code ?? args.versionCode ?? '').trim();
const releaseNotes = String(args.notes ?? args.releaseNotes ?? '').trim();

const baseUrl = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
const secret = process.env.APK_UPLOAD_SECRET?.trim();

if (!baseUrl) {
  console.error('APP_URL veya NEXT_PUBLIC_APP_URL gerekli');
  process.exit(1);
}

if (!secret) {
  console.error('APK_UPLOAD_SECRET gerekli');
  process.exit(1);
}

if (!appType || !filePath || !versionName || !versionCode) {
  console.error(
    'Kullanım: node scripts/upload-apk.mjs --app personnel|admin --file ./app.apk --version 1.0.0 --code 1 [--notes "..."]'
  );
  process.exit(1);
}

const buffer = readFileSync(filePath);
const form = new FormData();
form.set('appType', appType);
form.set('versionName', versionName);
form.set('versionCode', versionCode);
form.set('releaseNotes', releaseNotes);
form.set('file', new Blob([buffer], { type: 'application/vnd.android.package-archive' }), basename(filePath));

/** HTTP Authorization header yalnızca Latin-1; Türkçe karakter için base64 header kullan */
const uploadHeaders = { ...buildUploadAuthHeaders(secret) };

const res = await fetch(`${baseUrl}/api/developer/releases`, {
  method: 'POST',
  headers: uploadHeaders,
  body: form,
});

const data = await res.json().catch(() => ({}));

if (!res.ok) {
  console.error('Yükleme başarısız:', data.error || res.statusText);
  process.exit(1);
}

console.log('OK:', data.message || 'APK yüklendi');
if (data.release?.id) {
  console.log('Release ID:', data.release.id);
  console.log('Developer panelden yayınlayın:', `${baseUrl}/developer-panel/releases`);
}
