#!/usr/bin/env node

/**
 * Bubblewrap update + Gradle release build + APK yükleme.
 * bubblewrap build etkileşimli şifre ister; TWA_KEYSTORE_PASSWORD ile Gradle doğrudan kullanılır.
 *
 *   node scripts/bubblewrap-build-upload.mjs --app personnel
 *   node scripts/bubblewrap-build-upload.mjs --app personnel --skip-update --skip-build
 *
 * Ortam: TWA_KEYSTORE_PASSWORD, APP_URL / NEXT_PUBLIC_APP_URL, APK_UPLOAD_SECRET
 */

import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'fs';
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

function run(cmd, args, cwd, env = process.env, options = {}) {
  console.log(`\n> ${cmd} ${args.join(' ')}\n`);
  const result = spawnSync(cmd, args, {
    stdio: 'inherit',
    cwd,
    shell: options.shell ?? false,
    env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function ensureGradleWindowsFixes(buildDir) {
  const gradleProps = join(buildDir, 'gradle.properties');
  if (existsSync(gradleProps)) {
    let text = readFileSync(gradleProps, 'utf8');
    if (!text.includes('android.overridePathCheck=true')) {
      text = `${text.trimEnd()}\nandroid.overridePathCheck=true\n`;
      writeFileSync(gradleProps, text);
      console.log('gradle.properties: android.overridePathCheck=true eklendi');
    }
  }

  const buildGradle = join(buildDir, 'app', 'build.gradle');
  if (!existsSync(buildGradle)) return;

  let gradle = readFileSync(buildGradle, 'utf8');
  if (!gradle.includes('signingConfigs')) {
    gradle = gradle.replace(
      /android \{\n    compileSdkVersion/,
      `android {
    compileSdkVersion`
    );
    gradle = gradle.replace(
      /(android \{\n    compileSdkVersion[^\n]+\n    namespace[^\n]+\n)/,
      `$1    signingConfigs {
        release {
            storeFile file("\${rootDir}/android.keystore")
            storePassword System.getenv('TWA_KEYSTORE_PASSWORD')
            keyAlias 'android'
            keyPassword System.getenv('TWA_KEYSTORE_PASSWORD')
        }
    }
`
    );
  }
  if (!gradle.includes('signingConfig signingConfigs.release')) {
    gradle = gradle.replace(
      /(release \{\n            minifyEnabled true\n)/,
      `$1            signingConfig signingConfigs.release\n`
    );
  }
  writeFileSync(buildGradle, gradle);
}

function applyPlainTwaSplash(buildDir, appType) {
  const variant = appType === 'admin' ? 'admin' : 'personnel';
  run(
    process.execPath,
    [join(ROOT, 'scripts/twa-minimal-splash.mjs'), buildDir, '--variant', variant],
    ROOT
  );
}

function applyAdminShareTarget(buildDir, appType) {
  if (appType !== 'admin') return;
  run(process.execPath, [join(ROOT, 'scripts/twa-share-target.mjs'), buildDir], ROOT);
}

const args = parseArgs(process.argv);
const appType = String(args.app ?? args.appType ?? '').trim();
const skipBuild = Boolean(args['skip-build']);
const skipUpdate = Boolean(args['skip-update']);

if (appType !== 'personnel' && appType !== 'admin') {
  console.error(
    'Kullanım: node scripts/bubblewrap-build-upload.mjs --app personnel|admin [--skip-update] [--skip-build] [--notes "..."]'
  );
  process.exit(1);
}

const buildDir = resolve(ROOT, args.dir || DEFAULT_DIRS[appType]);

if (!existsSync(join(buildDir, 'twa-manifest.json'))) {
  console.error(`Bubblewrap projesi yok: ${buildDir}`);
  console.error('Admin için: npm run twa:setup-admin');
  console.error('Personel için: twa/README.md — bubblewrap init adımlarını uygulayın.');
  process.exit(1);
}

if (!skipUpdate) {
  run('npx', ['@bubblewrap/cli', 'update'], buildDir);
}

ensureGradleWindowsFixes(buildDir);
applyPlainTwaSplash(buildDir, appType);
applyAdminShareTarget(buildDir, appType);

if (!skipBuild) {
  const keystorePassword = process.env.TWA_KEYSTORE_PASSWORD?.trim();
  if (!keystorePassword) {
    console.error('TWA_KEYSTORE_PASSWORD ortam değişkeni gerekli (keystore şifresi).');
    process.exit(1);
  }

  const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
  run(gradlew, ['assembleRelease', '--stacktrace'], buildDir, {
    ...process.env,
    TWA_KEYSTORE_PASSWORD: keystorePassword,
  }, { shell: process.platform === 'win32' });

  const releaseApk = join(buildDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
  const signedCopy = join(buildDir, 'app-release-signed.apk');
  if (!existsSync(releaseApk)) {
    console.error(`APK bulunamadı: ${releaseApk}`);
    process.exit(1);
  }
  copyFileSync(releaseApk, signedCopy);
  console.log(`\nAPK: ${signedCopy}`);
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
