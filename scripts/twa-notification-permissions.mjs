#!/usr/bin/env node

/**
 * TWA: Android 13+ bildirim izni (POST_NOTIFICATIONS) + uygulama açılışında sistem diyaloğu.
 *
 *   node scripts/twa-notification-permissions.mjs twa-build/personel
 *   node scripts/twa-notification-permissions.mjs twa-build/personel --bump
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

function parseArgs(argv) {
  const args = { bump: false, dir: null };
  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    if (key === '--bump') {
      args.bump = true;
      continue;
    }
    if (!key.startsWith('--') && !args.dir) {
      args.dir = key;
    }
  }
  return args;
}

function patchManifest(manifestPath) {
  if (!existsSync(manifestPath)) return;
  let xml = readFileSync(manifestPath, 'utf8');

  if (!xml.includes('android.permission.POST_NOTIFICATIONS')) {
    xml = xml.replace(
      /<manifest[^>]*>/,
      (match) =>
        `${match}\n\n    <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>`
    );
  }

  if (!xml.includes('NotificationPermissionRequestActivity')) {
    xml = xml.replace(
      /<\/application>/,
      `\n        <activity android:name="com.google.androidbrowserhelper.trusted.NotificationPermissionRequestActivity" />\n\n    </application>`
    );
  }

  writeFileSync(manifestPath, xml);
  console.log('AndroidManifest: POST_NOTIFICATIONS + NotificationPermissionRequestActivity');
}

function patchBuildGradle(buildGradlePath) {
  if (!existsSync(buildGradlePath)) return;
  let gradle = readFileSync(buildGradlePath, 'utf8');

  gradle = gradle.replace(/targetSdkVersion\s+\d+/, 'targetSdkVersion 35');
  gradle = gradle.replace(/compileSdkVersion\s+\d+/, 'compileSdkVersion 36');

  if (!gradle.includes('enableNotifications: true')) {
    gradle = gradle.replace(
      /enableNotifications:\s*false/,
      'enableNotifications: true'
    );
  }

  writeFileSync(buildGradlePath, gradle);
  console.log('build.gradle: targetSdk 35, enableNotifications');
}

function patchTwaManifest(manifestPath, bump) {
  if (!existsSync(manifestPath)) return;
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  manifest.enableNotifications = true;

  if (bump) {
    const code = Number(manifest.appVersionCode ?? manifest.versionCode ?? 0) + 1;
    manifest.appVersionCode = code;
    manifest.appVersion = String(code);
    manifest.appVersionName = String(code);
    console.log(`twa-manifest.json: sürüm → ${code}`);
  }

  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  if (bump && existsSync(join(manifestPath, '..'))) {
    const buildGradle = join(manifestPath, '..', 'app', 'build.gradle');
    if (existsSync(buildGradle)) {
      let gradle = readFileSync(buildGradle, 'utf8');
      const code = manifest.appVersionCode;
      gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${code}`);
      gradle = gradle.replace(/versionName\s+"[^"]+"/, `versionName "${code}"`);
      writeFileSync(buildGradle, gradle);
    }
  }

  console.log('twa-manifest.json: enableNotifications=true');
}

function patchLauncherActivity(buildDir, packageId) {
  const javaPath = join(
    buildDir,
    'app',
    'src',
    'main',
    'java',
    ...packageId.split('.'),
    'LauncherActivity.java'
  );
  if (!existsSync(javaPath)) {
    console.warn('LauncherActivity.java bulunamadı, atlanıyor');
    return;
  }

  const source = `/*
 * Copyright 2020 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package ${packageId};

import android.Manifest;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

public class LauncherActivity
        extends com.google.androidbrowserhelper.trusted.LauncherActivity {

    private static final int REQUEST_POST_NOTIFICATIONS = 9101;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (Build.VERSION.SDK_INT > Build.VERSION_CODES.O) {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
        } else {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
        }
        requestPostNotificationsOnLaunch();
    }

    /** Android 13+ — uygulama açılışında sistem bildirim izni */
    private void requestPostNotificationsOnLaunch() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            return;
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                == PackageManager.PERMISSION_GRANTED) {
            return;
        }
        ActivityCompat.requestPermissions(
                this,
                new String[] { Manifest.permission.POST_NOTIFICATIONS },
                REQUEST_POST_NOTIFICATIONS
        );
    }

    @Override
    protected Uri getLaunchingUrl() {
        return super.getLaunchingUrl();
    }
}
`;

  writeFileSync(javaPath, source);
  console.log('LauncherActivity: açılışta POST_NOTIFICATIONS isteği');
}

const args = parseArgs(process.argv);
const buildDir = resolve(process.cwd(), args.dir ?? 'twa-build/personel');

if (!existsSync(join(buildDir, 'twa-manifest.json'))) {
  console.error(`TWA projesi yok: ${buildDir}`);
  process.exit(1);
}

const twaManifest = JSON.parse(readFileSync(join(buildDir, 'twa-manifest.json'), 'utf8'));
const packageId = String(twaManifest.packageId ?? 'app.crewledger.personel');

patchTwaManifest(join(buildDir, 'twa-manifest.json'), args.bump);
patchManifest(join(buildDir, 'app', 'src', 'main', 'AndroidManifest.xml'));
patchBuildGradle(join(buildDir, 'app', 'build.gradle'));
patchLauncherActivity(buildDir, packageId);

console.log('TWA bildirim yamaları uygulandı.');
