#!/usr/bin/env node
/**
 * Restore structural keys (id, tab, href) in personnel-mobile-nav from EN source.
 * Translation mistakenly localized these keys and broke icon mapping.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EN = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'json/en/src/config/personnel-mobile-nav.json'), 'utf8')
);
const LOCALES = ['zh', 'hi', 'es', 'fr', 'ar', 'bn', 'pt', 'ru', 'ur', 'id', 'de', 'ja', 'hu'];

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

for (const loc of LOCALES) {
  const p = path.join(ROOT, 'json', loc, 'src/config/personnel-mobile-nav.json');
  if (!fs.existsSync(p)) continue;
  const j = JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
  for (let si = 0; si < j.hubSections.length; si++) {
    const enSection = EN.hubSections[si];
    if (!enSection) continue;
    for (let ii = 0; ii < j.hubSections[si].items.length; ii++) {
      const enItem = enSection.items[ii];
      if (!enItem) continue;
      j.hubSections[si].items[ii].id = enItem.id;
      if (enItem.tab) j.hubSections[si].items[ii].tab = enItem.tab;
      else delete j.hubSections[si].items[ii].tab;
      if (enItem.href) j.hubSections[si].items[ii].href = enItem.href;
      else delete j.hubSections[si].items[ii].href;
    }
  }
  writeJson(p, j);
  console.log('fixed', loc);
}
