#!/usr/bin/env node

/**
 * TWA splash → crewledger-intro.png (tam intro görseli, kare logo / lacivert boş ekran yok).
 *
 *   node scripts/twa-intro-splash.mjs twa-build/personel
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import sharp from 'sharp';

const INTRO_SOURCE = join(process.cwd(), 'public', 'crewledger-intro.png');
const ASPECT = 1844 / 853; // intro PNG oranı (~9:19.5)

/** Genişlik (dp tabanı) → portrait splash boyutu — APK boyutu için sınırlı */
const WIDTHS = {
  'drawable-mdpi': 240,
  'drawable-hdpi': 360,
  'drawable-xhdpi': 480,
  'drawable-xxhdpi': 640,
  'drawable-xxxhdpi': 960,
};

async function introSplashForDir(resDir, width) {
  const height = Math.round(width * ASPECT);
  const buffer = await sharp(INTRO_SOURCE)
    .resize(width, height, { fit: 'cover', position: 'centre' })
    .png({ compressionLevel: 9, adaptiveFiltering: true, palette: true })
    .toBuffer();
  writeFileSync(join(resDir, 'splash.png'), buffer);
}

async function main() {
  const buildDir = resolve(process.argv[2] || 'twa-build/personel');
  const resBase = join(buildDir, 'app', 'src', 'main', 'res');

  if (!existsSync(INTRO_SOURCE)) {
    console.error(`Intro PNG yok: ${INTRO_SOURCE}`);
    process.exit(1);
  }
  if (!existsSync(resBase)) {
    console.error(`res klasörü yok: ${resBase}`);
    process.exit(1);
  }

  for (const [folder, width] of Object.entries(WIDTHS)) {
    const dir = join(resBase, folder);
    if (!existsSync(dir)) continue;
    await introSplashForDir(dir, width);
    console.log(`splash → intro (${folder}, ${width}x${Math.round(width * ASPECT)})`);
  }

  const manifestPath = join(buildDir, 'twa-manifest.json');
  if (existsSync(manifestPath)) {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    manifest.splashScreenFadeOutDuration = 300;
    manifest.backgroundColor = '#0B1624';
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  }

  const buildGradle = join(buildDir, 'app', 'build.gradle');
  if (existsSync(buildGradle)) {
    let gradle = readFileSync(buildGradle, 'utf8');
    gradle = gradle.replace(/splashScreenFadeOutDuration: \d+/, 'splashScreenFadeOutDuration: 300');
    writeFileSync(buildGradle, gradle);
  }

  console.log('TWA splash: crewledger-intro kullanılıyor.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
