#!/usr/bin/env node
/**
 * VAPID doğrulama — plan adımları 1–3
 * Kullanım:
 *   node scripts/verify-vapid.mjs
 *   node scripts/verify-vapid.mjs --base https://crewledger.vercel.app --cron-secret YOUR_SECRET
 *   node scripts/verify-vapid.mjs --send-test   (CRON_SECRET ile POST test push)
 */

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const argv = process.argv.slice(2);

function arg(name) {
  const idx = argv.indexOf(name);
  return idx !== -1 && argv[idx + 1] ? argv[idx + 1] : '';
}

function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(envPath, 'utf8')
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const i = line.indexOf('=');
        return [line.slice(0, i), line.slice(i + 1)];
      })
  );
}

const fileEnv = loadEnvFile();
const baseUrl = (arg('--base') || process.env.NEXT_PUBLIC_APP_URL || 'https://crewledger.vercel.app').replace(
  /\/$/,
  ''
);
const cronSecret = arg('--cron-secret') || process.env.CRON_SECRET || fileEnv.CRON_SECRET || '';
const sendTest = argv.includes('--send-test');

async function fetchJson(pathname, init) {
  const res = await fetch(`${baseUrl}${pathname}`, init);
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  return { ok: res.ok, status: res.status, data };
}

function pass(label) {
  console.log(`✓ ${label}`);
}

function fail(label, detail) {
  console.log(`✗ ${label}`);
  if (detail) console.log(`  ${detail}`);
}

async function checkSupabaseDirect() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || fileEnv.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || fileEnv.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  const admin = createClient(url, key);
  const [subs, notifs] = await Promise.all([
    admin
      .from('personnel_push_subscriptions')
      .select('employee_id, updated_at', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .limit(5),
    admin
      .from('personnel_notifications')
      .select('id, type, push_sent_at, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  return {
    subscriptionCount: subs.count ?? subs.data?.length ?? 0,
    subscriptions: subs.data ?? [],
    notifications: notifs.data ?? [],
    hasPushSent: (notifs.data ?? []).some((row) => row.push_sent_at != null),
  };
}

async function main() {
  console.log(`VAPID doğrulama — ${baseUrl}\n`);
  let exitCode = 0;

  const vapid = await fetchJson('/api/personnel/push/vapid-public-key');
  if (vapid.ok && vapid.data.enabled && vapid.data.publicKey) {
    pass(`VAPID API: enabled=true, key=${String(vapid.data.publicKey).slice(0, 12)}…`);
  } else {
    fail('VAPID API: enabled=false veya publicKey yok', JSON.stringify(vapid.data));
    process.exitCode = 1;
    return;
  }

  const direct = await checkSupabaseDirect();
  if (direct) {
    console.log('');
    if (direct.subscriptionCount > 0) {
      pass(`Abonelik (DB): ${direct.subscriptionCount} cihaz — son güncelleme ${direct.subscriptions[0]?.updated_at ?? '?'}`);
    } else {
      fail('Abonelik (DB): personnel_push_subscriptions boş');
      exitCode = 1;
    }

    if (direct.hasPushSent) {
      const sample = direct.notifications.find((row) => row.push_sent_at);
      pass(`Push gönderimi (DB): push_sent_at dolu — örnek ${sample?.type} @ ${sample?.push_sent_at}`);
    } else {
      fail('Push gönderimi (DB): push_sent_at henüz dolu değil');
      exitCode = 1;
    }
  }

  if (cronSecret) {
    console.log('');
    const method = sendTest ? 'POST' : 'GET';
    const diag = await fetchJson('/api/cron/push-diagnostics', {
      method,
      headers: { Authorization: `Bearer ${cronSecret}` },
    });

    if (!diag.ok) {
      fail(`Push diagnostics (${method})`, `HTTP ${diag.status}: ${JSON.stringify(diag.data)}`);
      process.exitCode = 1;
      return;
    }

    if (diag.data.checklist?.hasSubscriptions) {
      pass(`Diagnostics: ${diag.data.subscriptions.total} abonelik`);
    } else {
      fail('Diagnostics: abonelik yok');
      exitCode = 1;
    }

    if (sendTest && diag.data.test?.pushSentAt) {
      pass(`Test push: push_sent_at=${diag.data.test.pushSentAt}, sent=${diag.data.test.push?.sent ?? 0}`);
    } else if (sendTest) {
      fail('Test push: push_sent_at boş', JSON.stringify(diag.data.test));
      exitCode = 1;
    } else if (diag.data.checklist?.pushSentRecently) {
      pass('Diagnostics: son bildirimlerde push_sent_at var');
    } else if (!direct?.hasPushSent) {
      fail('Diagnostics: push_sent_at dolu kayıt yok — deploy sonrası --send-test deneyin');
      exitCode = 1;
    }
  } else if (!direct) {
    console.log('\n— Adım 2–3: CRON_SECRET / Supabase yok; atlanıyor —');
    console.log('  Personel panelde bildirim izni verin, sonra giriş yapılıyken:');
    console.log(`  GET ${baseUrl}/api/personnel/push/status`);
    console.log('  Uçtan uca test: POST /api/personnel/push/test (personel oturumu ile)');
    console.log('\n  veya: node scripts/verify-vapid.mjs --cron-secret <CRON_SECRET> --send-test');
  }

  process.exitCode = exitCode || process.exitCode;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
