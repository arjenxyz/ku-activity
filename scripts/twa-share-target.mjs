#!/usr/bin/env node

/**
 * Admin TWA — Web Share Target (bankadan PDF/görsel paylaş).
 * Bubblewrap personel şablonundan klonlandığında intent-filter eklenmiyor.
 *
 *   node scripts/twa-share-target.mjs twa-build/admin
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.trim() || 'https://crewledger.vercel.app';

const SHARE_TARGET = {
  action: `${APP_URL}/api/admin/dekont/share-ingest`,
  method: 'POST',
  enctype: 'multipart/form-data',
  params: {
    title: 'title',
    text: 'text',
    files: [
      {
        name: 'dekont',
        accept: [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/heic',
          'image/*',
        ],
      },
    ],
  },
};

const MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/*',
];

function escapeShareTargetJson(obj) {
  return JSON.stringify(obj).replace(/"/g, '\\"');
}

function patchStringsXml(buildDir) {
  const stringsPath = join(buildDir, 'app', 'src', 'main', 'res', 'values', 'strings.xml');
  if (!existsSync(stringsPath)) {
    console.error(`strings.xml bulunamadı: ${stringsPath}`);
    process.exit(1);
  }

  let xml = readFileSync(stringsPath, 'utf8');
  const shareJson = escapeShareTargetJson(SHARE_TARGET);

  if (xml.includes('name="share_target"')) {
    xml = xml.replace(
      /<string name="share_target">[\s\S]*?<\/string>/,
      `<string name="share_target">${shareJson}</string>`
    );
  } else {
    xml = xml.replace(
      '</resources>',
      `  <string name="share_target">${shareJson}</string>\n</resources>`
    );
  }

  writeFileSync(stringsPath, xml);
  console.log('strings.xml: share_target eklendi');
}

function buildIntentFilterXml() {
  const mimeLines = MIME_TYPES.map(
    (mime) => `                <data android:mimeType="${mime}" />`
  ).join('\n');

  return `
            <meta-data
                android:name="android.support.customtabs.trusted.METADATA_SHARE_TARGET"
                android:resource="@string/share_target" />

            <intent-filter>
                <action android:name="android.intent.action.SEND" />
                <action android:name="android.intent.action.SEND_MULTIPLE" />
                <category android:name="android.intent.category.DEFAULT" />
${mimeLines}
            </intent-filter>`;
}

function patchAndroidManifest(buildDir) {
  const manifestPath = join(buildDir, 'app', 'src', 'main', 'AndroidManifest.xml');
  if (!existsSync(manifestPath)) {
    console.error(`AndroidManifest.xml bulunamadı: ${manifestPath}`);
    process.exit(1);
  }

  let xml = readFileSync(manifestPath, 'utf8');

  xml = xml.replace(
    /\s*<meta-data\s+android:name="android\.support\.customtabs\.trusted\.METADATA_SHARE_TARGET"[\s\S]*?\/>\s*/g,
    '\n'
  );
  xml = xml.replace(
    /\s*<intent-filter>\s*<action android:name="android\.intent\.action\.SEND"[\s\S]*?<\/intent-filter>\s*/g,
    '\n'
  );

  const marker = '<intent-filter android:autoVerify="true">';
  const insertAt = xml.indexOf(marker);
  if (insertAt === -1) {
    console.error('LauncherActivity intent-filter bulunamadı');
    process.exit(1);
  }

  xml = `${xml.slice(0, insertAt)}${buildIntentFilterXml()}\n\n            ${xml.slice(insertAt)}`;
  writeFileSync(manifestPath, xml);
  console.log('AndroidManifest: SHARE_TARGET meta-data + SEND intent-filter eklendi');
}

function patchTwaManifest(buildDir) {
  const manifestPath = join(buildDir, 'twa-manifest.json');
  if (!existsSync(manifestPath)) return;

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  manifest.shareTarget = SHARE_TARGET;
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log('twa-manifest.json: shareTarget güncellendi');
}

function main() {
  const buildDir = resolve(process.argv[2] || join(ROOT, 'twa-build/admin'));
  patchTwaManifest(buildDir);
  patchStringsXml(buildDir);
  patchAndroidManifest(buildDir);
  console.log('TWA share target hazır (PDF + görsel paylaşım menüsü).');
}

main();
