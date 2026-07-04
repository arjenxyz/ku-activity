#!/usr/bin/env node

/**
 * TWA: native splash görselini kaldır — yalnızca arka plan rengi, anında geçiş.
 *
 *   node scripts/twa-minimal-splash.mjs twa-build/personel
 *   node scripts/twa-minimal-splash.mjs twa-build/admin --variant admin
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

const VARIANTS = {
  personnel: {
    splashBg: '#0B1624',
    navBg: '#0B1624',
    statusBg: '#163A5C',
  },
  admin: {
    splashBg: '#0f172a',
    navBg: '#0f172a',
    statusBg: '#0f172a',
  },
};

function resolveVariant(buildDir, explicit) {
  if (explicit === 'admin' || explicit === 'personnel') return explicit;
  if (buildDir.replace(/\\/g, '/').includes('/admin')) return 'admin';
  return 'personnel';
}

function patchAndroidManifest(buildDir, { navBg }) {
  const manifestPath = join(buildDir, 'app', 'src', 'main', 'AndroidManifest.xml');
  if (!existsSync(manifestPath)) return;

  let xml = readFileSync(manifestPath, 'utf8');
  xml = xml.replace(
    /\s*<meta-data android:name="android\.support\.customtabs\.trusted\.SPLASH_IMAGE_DRAWABLE"[\s\S]*?\/>\s*/g,
    '\n'
  );
  xml = xml.replace(
    /android:theme="@android:style\/Theme\.Translucent\.NoTitleBar"/g,
    'android:theme="@style/Theme.CrewLedger.Launcher"'
  );
  writeFileSync(manifestPath, xml);
  console.log('AndroidManifest: SPLASH_IMAGE_DRAWABLE kaldırıldı, opak tema');
}

function patchOpaqueTheme(buildDir, { splashBg, navBg, statusBg }) {
  const valuesDir = join(buildDir, 'app', 'src', 'main', 'res', 'values');
  const themesPath = join(valuesDir, 'themes.xml');
  const themesXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <!-- Translucent tema ilk kurulumda beyaz WebView flash veriyordu -->
    <style name="Theme.CrewLedger.Launcher" parent="@android:style/Theme.NoTitleBar">
        <item name="android:windowBackground">@color/backgroundColor</item>
        <item name="android:windowIsTranslucent">false</item>
        <item name="android:windowDisablePreview">false</item>
        <item name="android:navigationBarColor">@color/navigationColor</item>
        <item name="android:statusBarColor">@color/colorPrimary</item>
    </style>
</resources>
`;
  writeFileSync(themesPath, themesXml);
  console.log(`themes.xml: opak launcher arka planı (${splashBg})`);
}

function patchConfigs(buildDir, { splashBg, navBg, statusBg }) {
  const manifestPath = join(buildDir, 'twa-manifest.json');
  if (existsSync(manifestPath)) {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    manifest.splashScreenFadeOutDuration = 0;
    manifest.backgroundColor = splashBg;
    manifest.themeColor = statusBg;
    manifest.navigationColor = navBg;
    manifest.navigationColorDark = navBg;
    manifest.navigationDividerColor = navBg;
    manifest.navigationDividerColorDark = navBg;
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  }

  const buildGradle = join(buildDir, 'app', 'build.gradle');
  if (existsSync(buildGradle)) {
    let gradle = readFileSync(buildGradle, 'utf8');
    gradle = gradle.replace(/splashScreenFadeOutDuration: \d+/, 'splashScreenFadeOutDuration: 0');
    gradle = gradle.replace(/navigationColor: '#[^']+'/g, `navigationColor: '${navBg}'`);
    gradle = gradle.replace(/navigationColorDark: '#[^']+'/g, `navigationColorDark: '${navBg}'`);
    gradle = gradle.replace(
      /navigationDividerColor: '#[^']+'/g,
      `navigationDividerColor: '${navBg}'`
    );
    gradle = gradle.replace(
      /navigationDividerColorDark: '#[^']+'/g,
      `navigationDividerColorDark: '${navBg}'`
    );
    gradle = gradle.replace(/backgroundColor: '#[^']+'/g, `backgroundColor: '${splashBg}'`);
    gradle = gradle.replace(/themeColor: '#[^']+'/g, `themeColor: '${statusBg}'`);
    writeFileSync(buildGradle, gradle);
  }
}

function main() {
  const argv = process.argv.slice(2);
  let variantArg;
  const buildArgs = [];
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--variant' && argv[i + 1]) {
      variantArg = argv[++i];
    } else {
      buildArgs.push(argv[i]);
    }
  }

  const buildDir = resolve(buildArgs[0] || 'twa-build/personel');
  const variant = resolveVariant(buildDir, variantArg);
  const colors = VARIANTS[variant];

  patchAndroidManifest(buildDir, colors);
  patchOpaqueTheme(buildDir, colors);
  patchConfigs(buildDir, colors);
  console.log(`TWA (${variant}): minimal splash + opak tema + nav bar intro rengi.`);
}

main();
