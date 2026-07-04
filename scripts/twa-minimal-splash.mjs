#!/usr/bin/env node

/**
 * TWA: native splash görselini kaldır — yalnızca arka plan rengi, anında geçiş.
 * Navigasyon çubuğu intro ile aynı tonda (#0B1624), siyah flash önlenir.
 *
 *   node scripts/twa-minimal-splash.mjs twa-build/personel
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

const SPLASH_BG = '#0B1624';
const NAV_BG = '#0B1624';
const STATUS_BG = '#163A5C';

function patchAndroidManifest(buildDir) {
  const manifestPath = join(buildDir, 'app', 'src', 'main', 'AndroidManifest.xml');
  if (!existsSync(manifestPath)) return;

  let xml = readFileSync(manifestPath, 'utf8');
  xml = xml.replace(
    /\s*<meta-data android:name="android\.support\.customtabs\.trusted\.SPLASH_IMAGE_DRAWABLE"[\s\S]*?\/>\s*/g,
    '\n'
  );
  writeFileSync(manifestPath, xml);
  console.log('AndroidManifest: SPLASH_IMAGE_DRAWABLE kaldırıldı');
}

function patchConfigs(buildDir) {
  const manifestPath = join(buildDir, 'twa-manifest.json');
  if (existsSync(manifestPath)) {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    manifest.splashScreenFadeOutDuration = 0;
    manifest.backgroundColor = SPLASH_BG;
    manifest.themeColor = STATUS_BG;
    manifest.navigationColor = NAV_BG;
    manifest.navigationColorDark = NAV_BG;
    manifest.navigationDividerColor = NAV_BG;
    manifest.navigationDividerColorDark = NAV_BG;
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  }

  const buildGradle = join(buildDir, 'app', 'build.gradle');
  if (existsSync(buildGradle)) {
    let gradle = readFileSync(buildGradle, 'utf8');
    gradle = gradle.replace(/splashScreenFadeOutDuration: \d+/, 'splashScreenFadeOutDuration: 0');
    gradle = gradle.replace(/navigationColor: '#[^']+'/g, `navigationColor: '${NAV_BG}'`);
    gradle = gradle.replace(/navigationColorDark: '#[^']+'/g, `navigationColorDark: '${NAV_BG}'`);
    gradle = gradle.replace(
      /navigationDividerColor: '#[^']+'/g,
      `navigationDividerColor: '${NAV_BG}'`
    );
    gradle = gradle.replace(
      /navigationDividerColorDark: '#[^']+'/g,
      `navigationDividerColorDark: '${NAV_BG}'`
    );
    writeFileSync(buildGradle, gradle);
  }
}

function main() {
  const buildDir = resolve(process.argv[2] || 'twa-build/personel');
  patchAndroidManifest(buildDir);
  patchConfigs(buildDir);
  console.log('TWA: minimal splash + nav bar rengi intro ile uyumlu.');
}

main();
