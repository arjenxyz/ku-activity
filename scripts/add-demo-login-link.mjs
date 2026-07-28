#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const vals = {
  tr: 'Demoyu dene (örnek veriler)',
  en: 'Try the demo (sample data)',
  zh: '试用演示（示例数据）',
  hi: 'डेमो आज़माएँ',
  es: 'Probar la demo',
  fr: 'Essayer la démo',
  ar: 'جرّب العرض التوضيحي',
  bn: 'ডেমো চেষ্টা করুন',
  pt: 'Experimentar a demo',
  ru: 'Попробовать демо',
  ur: 'ڈیمو آزمائیں',
  id: 'Coba demo',
  de: 'Demo ausprobieren',
  ja: 'デモを試す',
  hu: 'Próbáld ki a demót',
};

for (const [loc, v] of Object.entries(vals)) {
  const p =
    loc === 'tr'
      ? path.join(ROOT, 'json/src/app/personnel-panel/login/page.json')
      : path.join(ROOT, `json/${loc}/src/app/personnel-panel/login/page.json`);
  if (!fs.existsSync(p)) continue;
  const j = JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
  j.demoTryLink = v;
  fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n');
  console.log('ok', loc);
}
