#!/usr/bin/env node

/**
 * Personel TWA projesinden yönetici TWA projesini oluşturur.
 *
 *   node scripts/twa-setup-admin.mjs
 *
 * Sonrası:
 *   npm run apk:build-upload:admin
 */

import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'fs';
import { join, resolve } from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const SRC = join(ROOT, 'twa-build', 'personel');
const DEST = join(ROOT, 'twa-build', 'admin');

const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.trim() || 'https://crewledger.vercel.app';
const HOST = new URL(APP_URL).host;

const ADMIN_COLORS = {
  splashBg: '#0b1624',
  navBg: '#163a5c',
  statusBg: '#163a5c',
};

const ADMIN_TWA_MANIFEST = {
  packageId: 'app.crewledger.admin',
  host: HOST,
  name: 'CrewLedger Yönetici',
  launcherName: 'CL Yönetici',
  display: 'standalone',
  themeColor: ADMIN_COLORS.statusBg,
  themeColorDark: '#000000',
  navigationColor: ADMIN_COLORS.navBg,
  navigationColorDark: ADMIN_COLORS.navBg,
  navigationDividerColor: ADMIN_COLORS.navBg,
  navigationDividerColorDark: ADMIN_COLORS.navBg,
  backgroundColor: ADMIN_COLORS.splashBg,
  enableNotifications: true,
  startUrl: '/admin-panel/login',
  iconUrl: `${APP_URL}/y%C3%B6netici.png`,
  maskableIconUrl: `${APP_URL}/icons/admin/maskable/512`,
  monochromeIconUrl: `${APP_URL}/y%C3%B6netici.png`,
  splashScreenFadeOutDuration: 0,
  signingKey: {
    path: join(DEST, 'android.keystore'),
    alias: 'android',
  },
  appVersionName: '1',
  appVersionCode: 1,
  shortcuts: [
    {
      name: 'Projeler',
      shortName: 'Projeler',
      url: `${APP_URL}/admin-panel`,
      chosenIconUrl: `${APP_URL}/icons/admin/192`,
    },
    {
      name: 'Başvuru Onay',
      shortName: 'Başvurular',
      url: `${APP_URL}/admin-panel/basvuru-onay`,
      chosenIconUrl: `${APP_URL}/icons/admin/192`,
    },
    {
      name: 'Dekont paylaş',
      shortName: 'Dekont',
      url: `${APP_URL}/admin-panel/dekont-paylas`,
      chosenIconUrl: `${APP_URL}/icons/admin/192`,
    },
  ],
  generatorApp: 'bubblewrap-cli',
  webManifestUrl: `${APP_URL}/manifest-admin.webmanifest`,
  fallbackType: 'customtabs',
  features: {},
  alphaDependencies: { enabled: false },
  enableSiteSettingsShortcut: true,
  isChromeOSOnly: false,
  isMetaQuest: false,
  fullScopeUrl: `${APP_URL}/`,
  minSdkVersion: 21,
  orientation: 'portrait-primary',
  fingerprints: [],
  additionalTrustedOrigins: [],
  retainedBundles: [],
  protocolHandlers: [],
  fileHandlers: [],
  launchHandlerClientMode: '',
  displayOverride: ['standalone', 'minimal-ui'],
  appVersion: '1',
};

function shouldSkipCopy(relativePath) {
  const parts = relativePath.replace(/\\/g, '/').split('/');
  return parts.some((part) => part === 'build' || part === '.gradle') ||
    relativePath.endsWith('app-release-signed.apk') ||
    relativePath.endsWith('app-release-bundle.aab');
}

function copyProjectTree(srcDir, destDir, relative = '') {
  mkdirSync(destDir, { recursive: true });
  for (const entry of readdirSync(srcDir)) {
    const rel = relative ? `${relative}/${entry}` : entry;
    if (shouldSkipCopy(rel)) continue;
    const srcPath = join(srcDir, entry);
    const destPath = join(destDir, entry);
    if (statSync(srcPath).isDirectory()) {
      copyProjectTree(srcPath, destPath, rel);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

function replaceAll(text, replacements) {
  let out = text;
  for (const [from, to] of replacements) {
    out = out.split(from).join(to);
  }
  return out;
}

function patchTextFile(path, replacements) {
  if (!existsSync(path)) return;
  const next = replaceAll(readFileSync(path, 'utf8'), replacements);
  writeFileSync(path, next);
}

function patchJavaPackage() {
  const oldPkgDir = join(DEST, 'app', 'src', 'main', 'java', 'app', 'crewledger', 'personel');
  const newPkgDir = join(DEST, 'app', 'src', 'main', 'java', 'app', 'crewledger', 'admin');
  if (!existsSync(oldPkgDir)) return;
  mkdirSync(join(newPkgDir, '..'), { recursive: true });
  cpSync(oldPkgDir, newPkgDir, { recursive: true });
  rmSync(oldPkgDir, { recursive: true, force: true });

  for (const file of readdirSync(newPkgDir)) {
    if (!file.endsWith('.java')) continue;
    patchTextFile(join(newPkgDir, file), [['app.crewledger.personel', 'app.crewledger.admin']]);
  }
}

function run(cmd, args, cwd) {
  console.log(`\n> ${cmd} ${args.join(' ')}\n`);
  const result = spawnSync(cmd, args, { stdio: 'inherit', cwd, shell: process.platform === 'win32' });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function ensureNotificationSettingsManifest() {
  const manifestPath = join(DEST, 'app', 'src', 'main', 'AndroidManifest.xml');
  if (!existsSync(manifestPath)) return;
  let xml = readFileSync(manifestPath, 'utf8');
  if (xml.includes('NotificationSettingsActivity')) return;
  const activityBlock = `
        <activity
            android:name=".NotificationSettingsActivity"
            android:exported="true"
            android:theme="@android:style/Theme.Translucent.NoTitleBar">
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="crewledger" android:host="notification-settings" />
            </intent-filter>
        </activity>`;
  xml = xml.replace('</application>', `${activityBlock}\n    </application>`);
  writeFileSync(manifestPath, xml);
  console.log('NotificationSettingsActivity manifest yaması eklendi.');
}

function main() {
  if (!existsSync(join(SRC, 'twa-manifest.json'))) {
    console.error(`Personel TWA bulunamadı: ${SRC}`);
    console.error('Önce personel projesini bubblewrap ile oluşturun.');
    process.exit(1);
  }

  if (existsSync(DEST)) {
    console.log('Mevcut twa-build/admin temizleniyor…');
    rmSync(DEST, { recursive: true, force: true });
  }

  console.log('Personel TWA kopyalanıyor → admin…');
  copyProjectTree(SRC, DEST);

  const keystoreSrc = join(SRC, 'android.keystore');
  const keystoreDest = join(DEST, 'android.keystore');
  if (existsSync(keystoreSrc) && !existsSync(keystoreDest)) {
    copyFileSync(keystoreSrc, keystoreDest);
  }

  writeFileSync(join(DEST, 'twa-manifest.json'), `${JSON.stringify(ADMIN_TWA_MANIFEST, null, 2)}\n`);

  const replacements = [
    ['app.crewledger.personel', 'app.crewledger.admin'],
    ['CrewLedger Personel', 'CrewLedger Yönetici'],
    ["launcherName: 'CrewLedger'", "launcherName: 'CL Yönetici'"],
    ['manifest-personnel.webmanifest', 'manifest-admin.webmanifest'],
    ['/personnel-panel/login', '/admin-panel/login'],
    ['/personnel-panel/yoklama', '/admin-panel'],
    ['/personnel-panel', '/admin-panel'],
    ['#0B1624', ADMIN_COLORS.splashBg],
    ['#163A5C', ADMIN_COLORS.statusBg],
    ['#0f172a', ADMIN_COLORS.splashBg],
    ['QR Yoklama', 'Projeler'],
    ['Yoklama', 'Projeler'],
    ['Özet', 'Başvurular'],
    ['portrait-primary', 'portrait-primary'],
    ['versionCode 7', 'versionCode 1'],
    ['versionName "7"', 'versionName "1"'],
  ];

  patchTextFile(join(DEST, 'app', 'build.gradle'), replacements);
  patchTextFile(join(DEST, 'app', 'src', 'main', 'AndroidManifest.xml'), replacements);
  patchJavaPackage();

  run('npx', ['@bubblewrap/cli', 'update'], DEST);
  ensureNotificationSettingsManifest();
  run(process.execPath, [join(ROOT, 'scripts/twa-minimal-splash.mjs'), DEST, '--variant', 'admin'], ROOT);

  console.log('\nYönetici TWA hazır:', DEST);
  console.log('Build + upload: npm run apk:build-upload:admin');
  console.log('Parmak izi: npm run twa:fingerprint -- --keystore twa-build/admin/android.keystore');
}

main();
