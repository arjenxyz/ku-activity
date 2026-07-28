import fs from 'node:fs';
import path from 'node:path';

const locales = ['tr', 'en', 'zh', 'hi', 'es', 'fr', 'ar', 'bn', 'pt', 'ru', 'ur', 'id', 'de', 'ja', 'hu'];

function walk(dir, acc = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p, acc);
    else if (f.endsWith('.json')) acc.push(p);
  }
  return acc;
}

const trRoot = 'json/src';
const trFiles = walk(trRoot).map((f) => path.relative(trRoot, f).replace(/\\/g, '/'));

const stats = {};
for (const loc of locales) {
  const base = loc === 'tr' ? trRoot : `json/${loc}/src`;
  let missing = 0;
  let sameAsEn = 0;
  let translated = 0;
  for (const rel of trFiles) {
    const p = path.join(base, rel);
    if (!fs.existsSync(p)) {
      missing++;
      continue;
    }
    const enp = path.join('json/en/src', rel);
    if (!fs.existsSync(enp)) continue;
    const j = JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
    const enj = JSON.parse(fs.readFileSync(enp, 'utf8').replace(/^\uFEFF/, ''));
    if (JSON.stringify(j) === JSON.stringify(enj)) sameAsEn++;
    else translated++;
  }
  const total = trFiles.length;
  stats[loc] = {
    total,
    missing,
    sameAsEn,
    translated,
    pctTranslated: Math.round((translated / (total - missing)) * 100),
  };
}

console.log(JSON.stringify(stats, null, 2));
