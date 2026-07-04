#!/usr/bin/env node

/**
 * TWA splash PNG'lerini düz arka plan rengine çevirir (logo yok).
 * Bubblewrap update sonrası kare ikon splash'ını kaldırmak için.
 *
 *   node scripts/twa-plain-splash.mjs twa-build/personel
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import sharp from 'sharp';

const SPLASH_BG = { r: 11, g: 22, b: 36, alpha: 1 }; // #0B1624 — PERSONNEL_PWA_SPLASH_BG

const SIZES = {
  'drawable-mdpi': 300,
  'drawable-hdpi': 450,
  'drawable-xhdpi': 600,
  'drawable-xxhdpi': 900,
  'drawable-xxxhdpi': 1200,
};

async function plainSplashForDir(resDir, size) {
  const buffer = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: SPLASH_BG,
    },
  })
    .png()
    .toBuffer();
  writeFileSync(join(resDir, 'splash.png'), buffer);
}

async function main() {
  const buildDir = resolve(process.argv[2] || 'twa-build/personel');
  const resBase = join(buildDir, 'app', 'src', 'main', 'res');

  if (!existsSync(resBase)) {
    console.error(`res klasörü yok: ${resBase}`);
    process.exit(1);
  }

  for (const [folder, size] of Object.entries(SIZES)) {
    const dir = join(resBase, folder);
    if (!existsSync(dir)) continue;
    await plainSplashForDir(dir, size);
    console.log(`splash → düz renk (${folder}, ${size}px)`);
  }

  const manifestPath = join(buildDir, 'twa-manifest.json');
  if (existsSync(manifestPath)) {
    const manifest = JSON.parse(readFileSyncUtf8(manifestPath));
    manifest.splashScreenFadeOutDuration = 0;
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    console.log('twa-manifest: splashScreenFadeOutDuration=0');
  }

  const buildGradle = join(buildDir, 'app', 'build.gradle');
  if (existsSync(buildGradle)) {
    let gradle = readFileSyncUtf8(buildGradle);
    gradle = gradle.replace(/splashScreenFadeOutDuration: \d+/, 'splashScreenFadeOutDuration: 0');
    writeFileSync(buildGradle, gradle);
    console.log('build.gradle: splashScreenFadeOutDuration=0');
  }

  console.log('TWA splash: kare logo kaldırıldı, web intro (crewledger-intro) kalır.');
}

function readFileSyncUtf8(path) {
  return readFileSync(path, 'utf8');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
