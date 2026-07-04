#!/usr/bin/env node

/**
 * Keystore SHA-256 parmak izini yazdırır (Digital Asset Links / Vercel env).
 *
 *   TWA_KEYSTORE_PASSWORD=... npm run twa:fingerprint
 *   npm run twa:fingerprint -- --keystore twa-build/personel/android.keystore
 */

import { spawnSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));

function parseArgs(argv) {
  const args = { keystore: 'twa-build/personel/android.keystore', alias: 'android' };
  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    if (key === '--keystore' && argv[i + 1]) {
      args.keystore = argv[++i];
    } else if (key === '--alias' && argv[i + 1]) {
      args.alias = argv[++i];
    }
  }
  return args;
}

const args = parseArgs(process.argv);
const keystorePath = resolve(ROOT, args.keystore);
const password = process.env.TWA_KEYSTORE_PASSWORD?.trim();

if (!existsSync(keystorePath)) {
  console.error(`Keystore bulunamadı: ${keystorePath}`);
  process.exit(1);
}

if (!password) {
  console.error('TWA_KEYSTORE_PASSWORD gerekli');
  process.exit(1);
}

const result = spawnSync(
  'keytool',
  ['-list', '-v', '-keystore', keystorePath, '-alias', args.alias, '-storepass', password],
  { encoding: 'utf8' }
);

if (result.status !== 0) {
  console.error(result.stderr || result.stdout || 'keytool başarısız');
  process.exit(result.status ?? 1);
}

const match = result.stdout.match(/SHA256:\s*([0-9A-F:]+)/i);
if (!match) {
  console.error('SHA256 bulunamadı');
  process.exit(1);
}

const fingerprint = match[1].trim().toUpperCase();
console.log(fingerprint);
console.log('\nVercel env:');
console.log(`TWA_PERSONNEL_SHA256_FINGERPRINTS=${fingerprint}`);
console.log('\nsrc/lib/twa-fingerprints.defaults.ts dosyasına da ekleyin (APK sideload için).');
