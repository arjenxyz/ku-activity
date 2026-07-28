#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ACTORS = {
  tr: 'Yönetici',
  en: 'Administrator',
  zh: '管理员',
  hi: 'प्रशासक',
  es: 'Administrador',
  fr: 'Administrateur',
  ar: 'المسؤول',
  bn: 'প্রশাসক',
  pt: 'Administrador',
  ru: 'Администратор',
  ur: 'ایڈمن',
  id: 'Administrator',
  de: 'Administrator',
  ja: '管理者',
  hu: 'Adminisztrátor',
};

function writeJson(p, data) {
  const payload = JSON.stringify(data, null, 2) + '\n';
  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      fs.writeFileSync(p, payload);
      return;
    } catch (err) {
      if (attempt >= 10) throw err;
      const start = Date.now();
      while (Date.now() - start < 300 * attempt) {}
    }
  }
}

for (const [loc, actor] of Object.entries(ACTORS)) {
  const p =
    loc === 'tr'
      ? path.join(ROOT, 'json/src/lib/personnel-notifications.json')
      : path.join(ROOT, `json/${loc}/src/lib/personnel-notifications.json`);
  if (!fs.existsSync(p)) continue;
  const j = JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
  j.defaults = { actorName: actor };
  writeJson(p, j);
  console.log('ok', loc);
}
